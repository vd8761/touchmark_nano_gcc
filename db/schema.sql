-- DOS Club - memberships, payments and admin schema.
--
-- Apply once against the Neon database (SQL editor or `psql $DATABASE_URL -f
-- db/schema.sql`). Every statement is idempotent, so re-running it is safe.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enquiries: every form submission, both audiences.
-- ---------------------------------------------------------------------------
create table if not exists enquiries (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('institution', 'organisation')),
  name          text not null,
  email         text not null,
  organization  text not null,
  phone         text,
  role          text,
  city          text,
  team_size     text,
  interest      text,
  message       text,
  -- Attribution, captured server-side from the request.
  referrer      text,
  utm           jsonb,
  ip_hash       text,
  user_agent    text,
  -- Admin-side triage.
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'qualified', 'won', 'closed')),
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists enquiries_created_idx on enquiries (created_at desc);
create index if not exists enquiries_email_idx   on enquiries (lower(email));
create index if not exists enquiries_kind_idx    on enquiries (kind, status);

-- ---------------------------------------------------------------------------
-- Orders: one row per payment attempt.
--
-- `order_ref` is the public handle. It travels to originbi.com, comes back in
-- the return URL, is quoted in emails and is what a buyer types into the
-- membership lookup - so it is high-entropy rather than sequential.
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_ref           text not null unique,
  enquiry_id          uuid references enquiries (id) on delete set null,
  email               text not null,
  name                text,
  phone               text,
  organization        text,
  plan                text not null default 'institution-annual',
  amount_paise        integer not null check (amount_paise >= 0),
  currency            text not null default 'INR',
  status              text not null default 'created'
                      check (status in ('created', 'pending', 'paid', 'failed', 'abandoned')),
  -- Razorpay identifiers, populated as the payment progresses.
  razorpay_order_id   text,
  razorpay_payment_id text unique,
  payment_method      text,
  -- The bank/UPI-side reference (UPI RRN, netbanking bank_transaction_id, or
  -- card auth_code) - what actually shows up in the buyer's own bank or UPI
  -- app statement. Razorpay's own payment id (above) never matches that, so
  -- showing only the payment id reads as "this doesn't match what I paid."
  -- Fetched from Razorpay's payment.acquirer_data - not present in either
  -- completion webhook's own payload, so this is always a follow-up API call.
  bank_reference      text,
  failure_reason      text,
  paid_at             timestamptz,
  retried_by          uuid references orders (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- For databases created before `phone` was added to the handoff payload.
alter table orders add column if not exists phone text;
-- For databases created before the bank/UPI reference was tracked.
alter table orders add column if not exists bank_reference text;

create index if not exists orders_email_idx   on orders (lower(email));
create index if not exists orders_status_idx  on orders (status, created_at desc);
create index if not exists orders_rzp_ord_idx on orders (razorpay_order_id);
create index if not exists orders_created_idx on orders (created_at desc);

-- ---------------------------------------------------------------------------
-- Legal Documents: Stores MoUs and Agreements as editable HTML.
-- ---------------------------------------------------------------------------
create table if not exists legal_documents (
  id            uuid primary key default gen_random_uuid(),
  document_key  text not null unique,
  title         text not null,
  content_html  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Memberships: created only against a confirmed payment.
--
-- The unique constraint on order_id is what makes webhook replays harmless.
-- ---------------------------------------------------------------------------
create table if not exists memberships (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null unique references orders (id) on delete restrict,
  member_no               text not null unique,
  email                   text not null,
  name                    text,
  institution             text,
  plan                    text not null default 'institution-annual',
  status                  text not null default 'active'
                          check (status in ('active', 'expired', 'cancelled')),
  activated_at            timestamptz not null default now(),
  valid_until             timestamptz,
  welcome_email_sent_at   timestamptz,
  profile_data            jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists memberships_valid_until_idx on memberships (valid_until);

create table if not exists membership_subscriptions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references memberships(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  valid_from timestamp with time zone not null,
  valid_until timestamp with time zone not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists membership_subscriptions_membership_id_idx on membership_subscriptions (membership_id);

create index if not exists memberships_email_idx on memberships (lower(email));
create index if not exists memberships_no_idx    on memberships (member_no);

-- Allocates the next DOS-<year>-NNNN member number. Runs inside the same
-- transaction as the membership insert, so two concurrent webhooks cannot be
-- handed the same number.
create sequence if not exists member_no_seq start 1;

-- ---------------------------------------------------------------------------
-- Admin auth.
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists admin_sessions (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_users (id) on delete cascade,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  ip_hash       text,
  user_agent    text
);

create index if not exists admin_sessions_user_idx on admin_sessions (admin_user_id);

create table if not exists admin_login_attempts (
  id         bigserial primary key,
  email      text not null,
  ip_hash    text not null,
  successful boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_idx
  on admin_login_attempts (lower(email), ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Webhook log. The unique event_id is the idempotency key: a replayed delivery
-- fails the insert, and the handler returns 200 without doing the work twice.
-- ---------------------------------------------------------------------------
create table if not exists webhook_events (
  id           uuid primary key default gen_random_uuid(),
  source       text not null check (source in ('razorpay', 'resend', 'originbi')),
  event_id     text not null,
  event_type   text,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  error        text,
  unique (source, event_id)
);

-- Widen the source check on databases created before the originbi completion
-- endpoint existed.
do $$
begin
  alter table webhook_events drop constraint if exists webhook_events_source_check;
  alter table webhook_events add constraint webhook_events_source_check
    check (source in ('razorpay', 'resend', 'originbi'));
end $$;

create index if not exists webhook_events_recv_idx on webhook_events (received_at desc);

-- ---------------------------------------------------------------------------
-- Site settings: a singleton row, editable from /admin/settings.
--
-- Every column here is an *override* - null (or the default `true`/`{}` for
-- the toggles) falls back to the equivalent env var or src/lib/pricing.ts
-- constant, so a database that predates this table, or an admin who has
-- never opened the settings page, behaves exactly as before.
--
-- `institution_annual_amount_paise` is named for the one plan that exists
-- today (see PlanId in pricing.ts) - if a second plan is ever added this
-- needs generalising into a proper per-plan table rather than one column per
-- plan.
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id                              boolean primary key default true check (id),
  admin_notify_emails             text[],
  from_name                       text,
  from_email                      text,
  reply_to                        text,
  cc                              text[],
  bcc                             text[],
  notify_admin_enquiry            boolean not null default true,
  notify_admin_payment            boolean not null default true,
  send_user_copy                  boolean not null default true,
  institution_annual_amount_paise integer check (institution_annual_amount_paise is null or institution_annual_amount_paise > 0),
  -- Null = follow the pricing.ts default (exclusive: GST is added on top of
  -- the configured price at checkout). True = the configured price is the
  -- GST-inclusive total and the tax is carved out of it.
  price_includes_gst              boolean,
  updated_at                      timestamptz not null default now()
);

insert into settings (id) values (true) on conflict (id) do nothing;

-- For databases created before the configurable price existed.
alter table settings add column if not exists institution_annual_amount_paise integer;
-- For databases created before the price could be GST-exclusive. Left null,
-- which means "follow pricing.ts" - see the column comment above.
alter table settings add column if not exists price_includes_gst boolean;
do $$
begin
  alter table settings drop constraint if exists settings_institution_annual_amount_paise_check;
  alter table settings add constraint settings_institution_annual_amount_paise_check
    check (institution_annual_amount_paise is null or institution_annual_amount_paise > 0);
end $$;

-- ---------------------------------------------------------------------------
-- Outbound email, tracked through the Resend webhook.
-- ---------------------------------------------------------------------------
create table if not exists email_events (
  id              uuid primary key default gen_random_uuid(),
  resend_email_id text unique,
  to_email        text not null,
  subject         text,
  template        text not null,
  order_id        uuid references orders (id) on delete set null,
  status          text not null default 'queued'
                  check (status in ('queued', 'sent', 'delivered', 'delivery_delayed',
                                    'bounced', 'complained', 'opened', 'clicked', 'failed')),
  error           text,
  last_event_at   timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists email_events_created_idx on email_events (created_at desc);
create index if not exists email_events_to_idx      on email_events (lower(to_email));

-- ---------------------------------------------------------------------------
-- Generic `updated_at` maintenance.
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['enquiries', 'orders', 'memberships', 'settings'] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format(
      'create trigger %I_touch before update on %I
         for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Nano GCC Portal Schema Extensions
-- ---------------------------------------------------------------------------

-- 1. Modify admin_users to act as universal users table for the portal.
alter table admin_users add column if not exists role text not null default 'ADMIN' 
  check (role in ('ADMIN', 'COMPANY', 'ECOSYSTEM_PARTNER', 'COLLEGE'));

-- 2. Ecosystem Partners
create table if not exists ecosystem_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references admin_users (id) on delete cascade,
  name text not null,
  contact_details jsonb not null default '{}',
  nda_status text not null default 'PENDING_NDA' 
    check (nda_status in ('PENDING_NDA', 'NDA_SIGNED', 'ACTIVE')),
  commission_type text not null default 'PERCENTAGE'
    check (commission_type in ('FIXED', 'PERCENTAGE')),
  commission_value numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references admin_users (id) on delete cascade,
  ecosystem_partner_id uuid references ecosystem_partners (id) on delete set null,
  name text not null,
  contact_details jsonb not null default '{}',
  nda_status text not null default 'PENDING_NDA'
    check (nda_status in ('PENDING_NDA', 'NDA_SIGNED', 'ACTIVE')),
  commission_type text not null default 'PERCENTAGE'
    check (commission_type in ('FIXED', 'PERCENTAGE')),
  commission_value numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_eco_idx on companies (ecosystem_partner_id);

-- 4. Colleges
create table if not exists colleges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references admin_users (id) on delete cascade,
  name text not null,
  membership_plan text not null,
  validity_start timestamptz,
  validity_end timestamptz,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'EXPIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Students (No login, managed by Admin/Company)
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  college_id uuid references colleges (id) on delete set null,
  company_id uuid references companies (id) on delete set null,
  batch_id uuid references internship_batches (id) on delete set null,
  category text not null check (category in ('INTERNSHIP', 'OFFER')),
  duration text,
  stipend numeric(10, 2),
  lpa numeric(10, 2),
  start_date date,
  completion_date date,
  status text not null default 'ACTIVE',
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_company_idx on students (company_id);
create index if not exists students_college_idx on students (college_id);
create index if not exists students_batch_idx on students (batch_id);

-- Run this migration if students table already exists:
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES internship_batches(id) ON DELETE SET NULL;

-- Add touch_updated_at triggers for new tables
do $$
declare t text;
begin
  foreach t in array array['ecosystem_partners', 'companies', 'colleges', 'students'] loop
    execute format('drop trigger if exists %I_touch on %I', t, t);
    execute format(
      'create trigger %I_touch before update on %I
         for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;
