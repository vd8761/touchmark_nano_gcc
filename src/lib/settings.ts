/**
 * Mail-routing settings.
 *
 * A singleton database row (see db/schema.sql), editable from
 * /admin/settings, so changing who gets notified or what address mail comes
 * from doesn't need a redeploy. Every field is an override: null falls back
 * to the equivalent env var, so a fresh database - or an admin who has never
 * opened the settings page - behaves exactly as it did before this existed.
 */

import { sql, type SettingsRow } from "./db";
import { env } from "./env";

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
      send_user_copy         = ${next.sendUserCopy}
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
