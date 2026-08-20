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

let client: Resend | null = null;

function resend(): Resend {
  if (!client) client = new Resend(env.resendApiKey);
  return client;
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

type SendInput = {
  to: string;
  template: string;
  message: Rendered;
  orderId?: string | null;
  replyTo?: string;
};

export async function send({
  to,
  template,
  message,
  orderId = null,
  replyTo,
}: SendInput): Promise<SendResult> {
  const q = sql();

  // Record the attempt first, so a send that succeeds at Resend but fails on
  // the way back to us still leaves a trace to reconcile against.
  const rows = (await q`
    insert into email_events (to_email, subject, template, order_id, status)
    values (${to}, ${message.subject}, ${template}, ${orderId}, 'queued')
    returning id
  `) as { id: string }[];

  const eventId = rows[0]!.id;

  try {
    const { data, error } = await resend().emails.send({
      from: env.resendFrom,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(replyTo ? { replyTo } : {}),
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
 * Fire-and-forget on purpose: a failure to notify ourselves is never a reason
 * to fail a buyer's request.
 */
export async function notifyTeam(message: Rendered): Promise<void> {
  try {
    await send({ to: env.adminNotifyEmail, template: "internal-notification", message });
  } catch {
    // Swallowed deliberately - see above.
  }
}
