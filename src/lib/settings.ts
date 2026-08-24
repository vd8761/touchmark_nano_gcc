/**
 * Site settings: mail routing and the institution membership price.
 *
 * A singleton database row (see db/schema.sql), editable from
 * /admin/settings, so changing who gets notified, what address mail comes
 * from, or what membership costs doesn't need a redeploy. Every field is an
 * override: null falls back to the equivalent env var or pricing.ts
 * constant, so a fresh database - or an admin who has never opened the
 * settings page - behaves exactly as it did before this existed.
 */

import { sql, type SettingsRow } from "./db";
import { env } from "./env";
import { PLANS, quotePrice, type PlanId, type Quote } from "./pricing";

export type Settings = {
  adminNotifyEmails: string[];
  fromName: string | null;
  fromEmail: string | null;
  replyTo: string | null;
  cc: string[];
  bcc: string[];
  notifyAdminEnquiry: boolean;
  notifyAdminPayment: boolean;
  sendUserCopy: boolean;
  /** Overrides PLANS["institution-annual"].amountPaise in pricing.ts. Null = use that default. */
  institutionAnnualAmountPaise: number | null;
  /**
   * Whether the configured price is read as GST-inclusive (the total) or
   * GST-exclusive (the taxable value, tax added at checkout). Overrides
   * PLANS["institution-annual"].priceIncludesGst. Null = use that default.
   */
  priceIncludesGst: boolean | null;
};

export type SettingsPatch = Partial<Settings>;

function fromRow(row: SettingsRow | undefined): Settings {
  return {
    adminNotifyEmails: row?.admin_notify_emails ?? [],
    fromName: row?.from_name ?? null,
    fromEmail: row?.from_email ?? null,
    replyTo: row?.reply_to ?? null,
    cc: row?.cc ?? [],
    bcc: row?.bcc ?? [],
    notifyAdminEnquiry: row?.notify_admin_enquiry ?? true,
    notifyAdminPayment: row?.notify_admin_payment ?? true,
    sendUserCopy: row?.send_user_copy ?? true,
    institutionAnnualAmountPaise: row?.institution_annual_amount_paise ?? null,
    priceIncludesGst: row?.price_includes_gst ?? null,
  };
}

/** Reads the singleton row. Never throws - a missing row just means defaults. */
export async function getSettings(): Promise<Settings> {
  const rows = (await sql()`select * from settings where id limit 1`) as SettingsRow[];
  return fromRow(rows[0]);
}

/** The recipients an admin notification should go to - configured list, or the env fallback. */
export function notifyRecipients(settings: Settings): string[] {
  return settings.adminNotifyEmails.length ? settings.adminNotifyEmails : [env.adminNotifyEmail];
}

/** The `from` header for every outbound send - configured address, or the env fallback. */
export function resolveFromAddress(settings: Settings): string {
  if (!settings.fromEmail) return env.resendFrom;
  return settings.fromName ? `${settings.fromName} <${settings.fromEmail}>` : settings.fromEmail;
}

/**
 * The price actually in effect right now - the admin-configured override if
 * one is set, otherwise the constant in pricing.ts - resolved into listed /
 * base / GST / total.
 *
 * `listedPaise` is what marketing copy quotes; `totalPaise` is what the buyer
 * is charged and what goes onto the order row. Under exclusive pricing those
 * two differ, so be deliberate about which one a given screen wants.
 *
 * This is the only thing that should ever be charged or advertised. Call it
 * wherever a *live* price is needed: creating a new order, or marketing copy
 * a prospective buyer sees before they have one. Everything downstream of an
 * existing order (receipts, admin tables, GST breakdowns) reads
 * `order.amount_paise` instead, which is fixed at the moment that order was
 * created and must never move again even if this override changes later.
 *
 * Lives here rather than in pricing.ts because it needs a database read, and
 * pricing.ts is imported by client components that must never pull in
 * server-only code.
 */
export async function getCurrentQuote(id: PlanId): Promise<Quote> {
  const plan = PLANS[id];
  if (id !== "institution-annual") {
    return quotePrice(plan.amountPaise, plan.gstRate, plan.priceIncludesGst);
  }

  const settings = await getSettings();
  return quoteFromSettings(plan, settings);
}

/** The same calculation against an already-loaded settings row. */
export function quoteFromSettings(plan: (typeof PLANS)[PlanId], settings: Settings): Quote {
  return quotePrice(
    settings.institutionAnnualAmountPaise ?? plan.amountPaise,
    plan.gstRate,
    settings.priceIncludesGst ?? plan.priceIncludesGst,
  );
}

/**
 * Merge-updates the singleton row. Reads current values first so a partial
 * patch from the settings form doesn't clobber fields it didn't touch.
 */
export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch };

  await sql()`
    update settings set
      admin_notify_emails  = ${next.adminNotifyEmails.length ? next.adminNotifyEmails : null},
      from_name             = ${next.fromName || null},
      from_email             = ${next.fromEmail || null},
      reply_to               = ${next.replyTo || null},
      cc                     = ${next.cc.length ? next.cc : null},
      bcc                    = ${next.bcc.length ? next.bcc : null},
      notify_admin_enquiry   = ${next.notifyAdminEnquiry},
      notify_admin_payment   = ${next.notifyAdminPayment},
      send_user_copy         = ${next.sendUserCopy},
      institution_annual_amount_paise = ${next.institutionAnnualAmountPaise},
      price_includes_gst     = ${next.priceIncludesGst}
    where id
  `;

  return next;
}

/** Splits a comma/newline/semicolon-separated list of addresses into a clean array. */
export function parseEmailList(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
