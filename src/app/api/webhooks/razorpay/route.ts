/**
 * POST /api/webhooks/razorpay
 *
 * The source of truth for whether a payment happened.
 *
 * Configure this URL as a second webhook on the same Razorpay account that
 * originbi.com uses, subscribed to `payment.captured`, `payment.failed` and
 * `order.paid`. Razorpay signs each delivery and retries non-2xx responses, so
 * this endpoint is both authenticated and durable in a way a browser redirect
 * never is.
 *
 * Three rules govern the handler:
 *
 *  1. Verify the signature over the *raw* body before touching anything.
 *  2. Deduplicate on the delivery id, so retries and manual replays are inert.
 *  3. Return 200 for anything successfully recorded - including events we
 *     choose to ignore. A non-2xx makes Razorpay retry work we already did.
 */

import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { hmacHex, safeEqual } from "@/lib/crypto";
import {
  applyPaymentFailure,
  applyPaymentSuccess,
  fetchBankReference,
  findOrderByRef,
  SITE_TAG,
} from "@/lib/payments";
import { deliverWelcomeEmail, notifyNewMembership } from "@/lib/membership";
import { json } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  method?: string;
  amount?: number;
  error_description?: string;
  error_reason?: string;
  receipt?: string;
  notes?: Record<string, string>;
};

type RazorpayEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

export async function POST(req: NextRequest) {
  // 1. Raw body first. Re-serialising parsed JSON would change the bytes and
  //    break the signature.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  let expected: string;
  try {
    expected = hmacHex(raw, env.razorpayWebhookSecret);
  } catch {
    // Secret not configured - fail closed rather than accepting unsigned data.
    return json({ ok: false }, 500);
  }

  if (!signature || !safeEqual(signature, expected)) {
    return json({ ok: false, error: "Invalid signature" }, 400);
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return json({ ok: false, error: "Malformed payload" }, 400);
  }

  const eventType = event.event ?? "unknown";
  const payment = event.payload?.payment?.entity;
  const order = event.payload?.order?.entity;

  // Razorpay's own delivery id; fall back to the payment id so we still
  // deduplicate if the header is ever missing.
  const deliveryId =
    req.headers.get("x-razorpay-event-id") ?? `${eventType}:${payment?.id ?? order?.id ?? raw.length}`;

  const q = sql();

  // 2. Claim the event. A replay loses the race against the unique index and
  //    exits here without repeating any work.
  const claimed = (await q`
    insert into webhook_events (source, event_id, event_type, payload)
    values ('razorpay', ${deliveryId}, ${eventType}, ${raw}::jsonb)
    on conflict (source, event_id) do nothing
    returning id
  `) as { id: string }[];

  if (!claimed.length) return json({ ok: true, duplicate: true });
  const eventRowId = claimed[0]!.id;

  try {
    const orderRef = resolveOrderRef(payment, order);

    // Not ours. The same Razorpay account also serves originbi's own traffic,
    // so silently acknowledging is the correct behaviour, not an error.
    if (!orderRef) {
      await markProcessed(eventRowId, "ignored: no matching order reference");
      return json({ ok: true, ignored: true });
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      await handleCaptured(orderRef, payment, order);
    } else if (eventType === "payment.failed") {
      await handleFailed(orderRef, payment, order);
    }

    await markProcessed(eventRowId, null);
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await q`update webhook_events set error = ${message} where id = ${eventRowId}`;

    // A real failure to record the payment *should* be retried, so this one
    // case returns 500 on purpose. The event row stays unprocessed, and the
    // cron sweeper is the second line of defence.
    return json({ ok: false }, 500);
  }
}

async function markProcessed(id: string, note: string | null) {
  await sql()`
    update webhook_events set processed_at = now(), error = ${note} where id = ${id}
  `;
}

/**
 * Finds our order reference in the event.
 *
 * originbi sets both `notes.order_ref` and the Razorpay `receipt` to it, so
 * either will do - and `notes.site` keeps us out of originbi's unrelated
 * payments on the same account.
 */
function resolveOrderRef(
  payment: RazorpayEntity | undefined,
  order: RazorpayEntity | undefined,
): string | null {
  for (const entity of [payment, order]) {
    if (!entity) continue;

    const notes = entity.notes ?? {};
    if (notes.site && notes.site !== SITE_TAG) continue;

    const ref = notes.order_ref ?? entity.receipt;
    if (ref && ref.startsWith("DOS-")) return ref;
  }
  return null;
}

async function handleCaptured(
  orderRef: string,
  payment: RazorpayEntity | undefined,
  order: RazorpayEntity | undefined,
) {
  const paymentId = payment?.id;
  if (!paymentId) return;

  const bankReference = await fetchBankReference(paymentId).catch(() => null);

  const result = await applyPaymentSuccess({
    orderRef,
    razorpayPaymentId: paymentId,
    razorpayOrderId: payment?.order_id ?? order?.id ?? null,
    method: payment?.method ?? null,
    amountPaise: payment?.amount ?? null,
    bankReference,
  });

  if (!result) return;

  // 3. Email is a side-effect, not part of the payment record. A Resend
  //    failure logs itself and gets retried by cron - it must never make this
  //    handler return non-2xx, which would have Razorpay replay the capture.
  if (result.created) {
    await deliverWelcomeEmail(result.order, result.membership);
    void notifyNewMembership(result.order, result.membership);
  }
}

async function handleFailed(
  orderRef: string,
  payment: RazorpayEntity | undefined,
  order: RazorpayEntity | undefined,
) {
  // Guard against a stale failure for an attempt that later succeeded.
  const existing = await findOrderByRef(orderRef);
  if (existing?.status === "paid") return;

  await applyPaymentFailure(
    orderRef,
    payment?.error_description ?? payment?.error_reason ?? "Payment failed",
    payment?.order_id ?? order?.id ?? null,
  );
}
