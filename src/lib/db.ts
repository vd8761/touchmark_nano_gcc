/**
 * Neon client and row types.
 *
 * `neon()` speaks Postgres over HTTP, which is what makes it usable from Vercel
 * functions with no connection pooling to manage. Each tagged-template call is
 * one round trip.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { env } from "./env";

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;

/**
 * Local development against Postgres in Docker.
 *
 * The Neon driver speaks SQL over *HTTP*, not the Postgres wire protocol, so it
 * cannot talk to a plain `postgres:16` container. `NEON_HTTP_PROXY` points it at
 * a proxy that terminates that HTTP protocol and forwards to real Postgres —
 * see docker-compose.yml. Unset in production, where it talks to Neon directly.
 */
if (process.env.NEON_HTTP_PROXY) {
  neonConfig.fetchEndpoint = process.env.NEON_HTTP_PROXY;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

/** Lazily constructed so importing this module never requires DATABASE_URL. */
export function sql(): Sql {
  if (!client) client = neon(env.databaseUrl);
  return client;
}

// ---------------------------------------------------------------------------
// Row types. These mirror db/schema.sql; keep them in step when it changes.
// ---------------------------------------------------------------------------

export type EnquiryKind = "institution" | "organisation";
export type EnquiryStatus = "new" | "contacted" | "qualified" | "won" | "closed";

export type Enquiry = {
  id: string;
  kind: EnquiryKind;
  name: string;
  email: string;
  organization: string;
  phone: string | null;
  role: string | null;
  city: string | null;
  team_size: string | null;
  interest: string | null;
  message: string | null;
  referrer: string | null;
  utm: Record<string, string> | null;
  ip_hash: string | null;
  user_agent: string | null;
  status: EnquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = "created" | "pending" | "paid" | "failed" | "abandoned";

export type Order = {
  id: string;
  order_ref: string;
  enquiry_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  organization: string | null;
  plan: string;
  amount_paise: number;
  currency: string;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_method: string | null;
  /** The UPI RRN / netbanking / card reference from Razorpay's acquirer_data - not the same as razorpay_payment_id. */
  bank_reference: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  retried_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  order_id: string;
  member_no: string;
  email: string;
  name: string | null;
  institution: string | null;
  plan: string;
  status: "active" | "expired" | "cancelled";
  activated_at: string;
  valid_until: string | null;
  welcome_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "delivery_delayed"
  | "bounced"
  | "complained"
  | "opened"
  | "clicked"
  | "failed";

export type EmailEvent = {
  id: string;
  resend_email_id: string | null;
  to_email: string;
  subject: string | null;
  template: string;
  order_id: string | null;
  status: EmailStatus;
  error: string | null;
  last_event_at: string | null;
  created_at: string;
};

export type SettingsRow = {
  id: true;
  admin_notify_emails: string[] | null;
  from_name: string | null;
  from_email: string | null;
  reply_to: string | null;
  cc: string[] | null;
  bcc: string[] | null;
  notify_admin_enquiry: boolean;
  notify_admin_payment: boolean;
  send_user_copy: boolean;
  institution_annual_amount_paise: number | null;
  price_includes_gst: boolean | null;
  updated_at: string;
};
