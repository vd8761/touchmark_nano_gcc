/**
 * POST /api/webhooks/resend
 *
 * Delivery tracking. Resend signs webhooks with Svix, so the verification
 * differs from Razorpay's: the signed payload is `id.timestamp.body`, and the
 * header can carry several space-separated `v1,<base64>` signatures during a
 * secret rotation - any one matching is enough.
 *
 * Add this URL in Resend > Webhooks, subscribed to the `email.*` events.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { sql, type EmailStatus } from "@/lib/db";
import { env } from "@/lib/env";
import { json } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resend event name -> the status we store. */
const STATUS_BY_EVENT: Record<string, EmailStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.failed": "failed",
};

/**
 * Terminal-ish states that must not be walked backwards.
 *
 * Resend can deliver `opened` before `delivered`, and we never want a later
 * `opened` to erase a `bounced`. Higher wins.
 */
const RANK: Record<EmailStatus, number> = {
  queued: 0,
  sent: 1,
  delivery_delayed: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  complained: 6,
  bounced: 7,
  failed: 7,
};

function verifySvix(req: NextRequest, raw: string): boolean {
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const header = req.headers.get("svix-signature");
  if (!id || !timestamp || !header) return false;

  // Reject anything more than five minutes old, so a captured delivery cannot
  // be replayed indefinitely.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  // Secrets are issued as `whsec_<base64>`; the raw key is the decoded part.
  const secret = env.resendWebhookSecret.replace(/^whsec_/, "");
  const key = Buffer.from(secret, "base64");

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${raw}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  return header.split(" ").some((part) => {
    const value = part.startsWith("v1,") ? part.slice(3) : null;
    if (!value) return false;
    const candidate = Buffer.from(value);
    return candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf);
  });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let valid: boolean;
  try {
    valid = verifySvix(req, raw);
  } catch {
    return json({ ok: false }, 500);
  }
  if (!valid) return json({ ok: false, error: "Invalid signature" }, 400);

  let event: { type?: string; data?: { email_id?: string; to?: string[]; reason?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Malformed payload" }, 400);
  }

  const status = STATUS_BY_EVENT[event.type ?? ""];
  const emailId = event.data?.email_id;
  if (!status || !emailId) return json({ ok: true, ignored: true });

  const q = sql();
  const deliveryId = req.headers.get("svix-id") ?? `${event.type}:${emailId}`;

  const claimed = (await q`
    insert into webhook_events (source, event_id, event_type, payload)
    values ('resend', ${deliveryId}, ${event.type ?? "unknown"}, ${raw}::jsonb)
    on conflict (source, event_id) do nothing
    returning id
  `) as { id: string }[];

  if (!claimed.length) return json({ ok: true, duplicate: true });

  // Only move the status forward - see RANK above.
  const ranks = Object.entries(RANK)
    .filter(([, rank]) => rank > RANK[status])
    .map(([name]) => name);

  await q`
    update email_events
       set status        = ${status},
           error         = coalesce(${event.data?.reason ?? null}, error),
           last_event_at = now()
     where resend_email_id = ${emailId}
       and not (status = any(${ranks}))
  `;

  await q`update webhook_events set processed_at = now() where id = ${claimed[0]!.id}`;

  return json({ ok: true });
}
