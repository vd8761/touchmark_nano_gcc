/**
 * Sending mail through the Resend API.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. **Sending never throws into the caller.** `send()` returns a result
 *     object. A Resend outage must not turn a captured payment into a 500 on
 *     the webhook, because Razorpay would then retry an event we already
 *     applied. Failures are logged to `email_events` and retried by cron.
 *  2. **Every send is recorded** in `email_events` with the id Resend returns,
 *     so the Resend webhook can attach delivery status to it later.
 */

import { Resend } from "resend";
import { sql } from "./db";
import { env } from "./env";
import type { Rendered } from "./email-templates";
import { getSettings, notifyRecipients, resolveFromAddress } from "./settings";

let client: Resend | null = null;

function resend(): Resend {
  if (!client) client = new Resend(env.resendApiKey);
  return client;
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

type SendInput = {
  to: string | string[];
  template: string;
  message: Rendered;
  orderId?: string | null;
  /** Overrides settings.replyTo, which itself falls back to unset (Resend defaults to `from`). */
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
};

export async function send({
  to,
  template,
  message,
  orderId = null,
  replyTo,
  cc,
  bcc,
}: SendInput): Promise<SendResult> {
  const q = sql();
  const settings = await getSettings();
  const toDisplay = Array.isArray(to) ? to.join(", ") : to;

  // Record the attempt first, so a send that succeeds at Resend but fails on
  // the way back to us still leaves a trace to reconcile against.
  const rows = (await q`
    insert into email_events (to_email, subject, template, order_id, status)
    values (${toDisplay}, ${message.subject}, ${template}, ${orderId}, 'queued')
    returning id
  `) as { id: string }[];

  const eventId = rows[0]!.id;
  const resolvedReplyTo = replyTo ?? settings.replyTo ?? undefined;

  try {
    const { data, error } = await resend().emails.send({
      from: resolveFromAddress(settings),
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(resolvedReplyTo ? { replyTo: resolvedReplyTo } : {}),
      ...(cc?.length ? { cc } : {}),
      ...(bcc?.length ? { bcc } : {}),
    });

    if (error) {
      await q`
        update email_events
           set status = 'failed', error = ${error.message ?? "Unknown Resend error"},
               last_event_at = now()
         where id = ${eventId}
      `;
      return { ok: false, error: error.message ?? "Unknown Resend error" };
    }

    await q`
      update email_events
         set resend_email_id = ${data?.id ?? null}, status = 'sent', last_event_at = now()
       where id = ${eventId}
    `;

    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    const messageText = err instanceof Error ? err.message : String(err);
    await q`
      update email_events
         set status = 'failed', error = ${messageText}, last_event_at = now()
       where id = ${eventId}
    `;
    return { ok: false, error: messageText };
  }
}

/**
 * Internal notification to the team inbox.
 *
 * `kind` gates against the admin's own toggle for that category (settings
 * page) - "notify me about enquiries" and "notify me about payments" are
 * independent switches, both on by default so a fresh database behaves as
 * this always did.
 *
 * Fire-and-forget on purpose: a failure to notify ourselves is never a reason
 * to fail a buyer's request.
 */
export async function notifyTeam(
  message: Rendered,
  kind: "enquiry" | "payment" = "payment",
): Promise<void> {
  try {
    const settings = await getSettings();
    const enabled = kind === "enquiry" ? settings.notifyAdminEnquiry : settings.notifyAdminPayment;
    if (!enabled) return;

    await send({
      to: notifyRecipients(settings),
      template: "internal-notification",
      message,
      cc: settings.cc,
      bcc: settings.bcc,
    });
  } catch {
    // Swallowed deliberately - see above.
  }
}
