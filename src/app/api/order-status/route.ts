/**
 * GET /api/order-status?ref=DOS-...
 *
 * Polled by the return page while a payment settles.
 *
 * The interesting part is the self-heal: if the order is still unconfirmed and
 * old enough that a webhook really should have landed, we ask Razorpay
 * directly and apply the answer through the same code path the webhook uses.
 * That is what makes a dropped webhook a non-event rather than a lost payment.
 *
 * The `ref` is the buyer's bearer token - unguessable, and it only ever
 * discloses their own order.
 */

import type { NextRequest } from "next/server";
import { findMembershipByOrderId, findOrderByRef, reconcileOrder } from "@/lib/payments";
import { deliverWelcomeEmail } from "@/lib/membership";
import { gstBreakdown, getPlan, PLANS } from "@/lib/pricing";
import { clientIpHash, json, rateLimit } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Grace period before we stop trusting the webhook to arrive on its own. */
const SELF_HEAL_AFTER_MS = 20_000;

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim() ?? "";

  if (!/^DOS-[0-9A-Z]{12}$/.test(ref)) {
    return json({ ok: false, status: "unknown" }, 400);
  }

  // Generous, because the page polls: this is here to stop reference-guessing,
  // not to interfere with a legitimate buyer watching their payment settle.
  const limit = await rateLimit("order-status", clientIpHash(req), {
    max: 120,
    windowMinutes: 15,
  });
  if (!limit.allowed) return json({ ok: false, status: "rate_limited" }, 429);

  let order = await findOrderByRef(ref);
  if (!order) return json({ ok: false, status: "unknown" }, 404);

  const age = Date.now() - new Date(order.created_at).getTime();
  const unconfirmed = order.status === "created" || order.status === "pending";

  if (unconfirmed && age > SELF_HEAL_AFTER_MS) {
    order = await reconcileOrder(order);
  }

  if (order.status !== "paid") {
    return json({
      ok: true,
      status: order.status,
      orderRef: order.order_ref,
      // Lets the page decide between "confirming..." and "taking longer than
      // usual" without keeping its own clock across refreshes.
      ageMs: age,
      failureReason: order.status === "failed" ? order.failure_reason : null,
    });
  }

  const membership = await findMembershipByOrderId(order.id);

  // Reconciliation may have just activated this membership, in which case the
  // receipt has not been sent yet. Claim-guarded, so polling cannot spam it.
  if (membership && !membership.welcome_email_sent_at) {
    void deliverWelcomeEmail(order, membership);
  }

  const plan = getPlan(order.plan) ?? PLANS["institution-annual"];
  const gst = gstBreakdown(order.amount_paise, plan.gstRate);

  return json({
    ok: true,
    status: "paid",
    orderRef: order.order_ref,
    memberNo: membership?.member_no ?? null,
    institution: order.organization,
    name: order.name,
    email: order.email,
    transactionId: order.razorpay_payment_id,
    paymentMethod: order.payment_method,
    paidAt: order.paid_at,
    validUntil: membership?.valid_until ?? null,
    planName: plan.name,
    amountPaise: gst.totalPaise,
    basePaise: gst.basePaise,
    gstPaise: gst.gstPaise,
    gstRate: gst.gstRate,
  });
}
