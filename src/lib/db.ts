/**
 * Neon client and row types.
 *
 * `neon()` speaks Postgres over HTTP, which is what makes it usable from Vercel
 * functions with no connection pooling to manage. Each tagged-template call is
 * one round trip.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { env } from "./env";

// Fix for Next.js fetch cache and connection pooling issues
neonConfig.fetchConnectionCache = true;

type Sql = ReturnType<typeof neon>;

let client: Sql | null = null;

// If a local proxy is specified (e.g. for docker compose), use it.
if (process.env.NEON_HTTP_PROXY) {
  neonConfig.fetchEndpoint = process.env.NEON_HTTP_PROXY;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

export interface TypedSql {
  (strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
  (query: string, params?: any[]): Promise<any[]>;
}

/** Lazily constructed so importing this module never requires DATABASE_URL. */
export function sql(): TypedSql {
  if (!client) client = neon(env.databaseUrl);
  return client as unknown as TypedSql;
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

export type MembershipSubscription = {
  id: string;
  membership_id: string;
  order_id: string | null;
  valid_from: string;
  valid_until: string;
  created_at: string;
};

export type Role = "ADMIN" | "COMPANY" | "ECOSYSTEM_PARTNER" | "COLLEGE";

export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type EcosystemPartner = {
  id: string;
  user_id: string;
  name: string;
  contact_details: any;
  nda_status: "PENDING_NDA" | "NDA_SIGNED" | "ACTIVE";
  commission_type: "FIXED" | "PERCENTAGE";
  commission_value: number;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  user_id: string;
  ecosystem_partner_id: string | null;
  name: string;
  contact_details: any;
  nda_status: "PENDING_NDA" | "NDA_SIGNED" | "ACTIVE";
  commission_type: "FIXED" | "PERCENTAGE";
  commission_value: number;
  created_at: string;
  updated_at: string;
};

export type College = {
  id: string;
  user_id: string;
  name: string;
  membership_plan: string;
  validity_start: string | null;
  validity_end: string | null;
  status: "ACTIVE" | "EXPIRED";
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college_id: string | null;
  company_id: string | null;
  category: "INTERNSHIP" | "OFFER";
  duration: string | null;
  stipend: number | null;
  lpa: number | null;
  start_date: string | null;
  status: string;
  feedback: string | null;
  created_at: string;
  updated_at: string;
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
