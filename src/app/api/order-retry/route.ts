/**
 * POST /api/order-retry  { ref }
 *
 * "Try again" after a failed payment.
 *
 * Always mints a *fresh* order reference rather than reopening the failed one.
 * Reusing a reference that Razorpay already has a failed payment against
 * invites confusing states - two payments under one receipt, or a late webhook
 * for the first attempt overwriting the second.
 */

import type { NextRequest } from "next/server";
import { sql, type Order } from "@/lib/db";
import { buildCheckoutUrl, createRetryOrder, findOrderByRef } from "@/lib/payments";
import { badRequest, clientIpHash, json, rateLimit, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  let body: { ref?: string };
  try {
    body = (await req.json()) as { ref?: string };
  } catch {
    return badRequest("Malformed request.");
  }

  const ref = body.ref?.trim() ?? "";
  if (!/^DOS-[0-9A-Z]{12}$/.test(ref)) return badRequest("Unknown reference.");

  const limit = await rateLimit("order-retry", clientIpHash(req), { max: 10, windowMinutes: 30 });
  if (!limit.allowed) {
    return json({ ok: false, error: "Too many attempts. Please try again shortly." }, 429);
  }

  const previous = await findOrderByRef(ref);
  if (!previous) return json({ ok: false, error: "Unknown reference." }, 404);

  // Already paid: send them to the receipt instead of taking a second payment.
  if (previous.status === "paid") {
    return json({ ok: true, alreadyPaid: true, orderRef: previous.order_ref });
  }

  // Already retried: reuse that retry rather than starting a third order.
  if (previous.retried_by) {
    const rows = (await sql()`
      select * from orders where id = ${previous.retried_by} and status <> 'paid'
    `) as Order[];

    if (rows[0]) {
      return json({ ok: true, orderRef: rows[0].order_ref, checkoutUrl: buildCheckoutUrl(rows[0]) });
    }
  }

  const retry = await createRetryOrder(previous);

  return json({
    ok: true,
    orderRef: retry.order_ref,
    checkoutUrl: buildCheckoutUrl(retry),
  });
}
