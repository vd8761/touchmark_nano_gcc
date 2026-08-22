/**
 * POST /api/webhooks/originbi
 *
 * The completion callback from originbi.com's checkout page, sent immediately
 * after Razorpay's modal returns success.
 *
 * This is the **fast path**: it is what makes the buyer's return screen show a
 * receipt within a second rather than waiting on Razorpay's webhook. It is not
 * the guarantee. Because it originates in the buyer's browser, it is lost if
 * the tab closes in the moment between payment and this request landing - so
 * `/api/webhooks/razorpay` (signed and retried by Razorpay, server to server)
 * remains the authority, and the cron sweeper catches anything both miss.
 *
 * Trusting this endpoint therefore rests entirely on `razorpay_signature`,
 * which is HMAC-SHA256 of `order_id|payment_id` keyed with our Razorpay API
 * secret. Only Razorpay can produce it, so a forged POST cannot mint a
 * membership. Nothing else in the body is trusted: the amount, plan and
 * identity all come from our own order row, looked up by `ref`.
 */

import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { applyPaymentSuccess, findOrderByRef, verifyRazorpaySignature } from "@/lib/payments";
import { deliverWelcomeEmail } from "@/lib/membership";
import { notifyTeam } from "@/lib/email";
import { internalNotification } from "@/lib/email-templates";
import { formatInr } from "@/lib/pricing";
import { json } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  ref?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  method?: string;
};

export async function POST(req: NextRequest) {
  // Called cross-origin from originbi.com, so no same-origin check here - the
  // Razorpay signature is what authenticates this request, not its origin.
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400, true);
  }

  const ref = body.ref?.trim() ?? "";
  const razorpayOrderId = body.razorpay_order_id?.trim() ?? "";
  const razorpayPaymentId = body.razorpay_payment_id?.trim() ?? "";
  const providedSignature = body.razorpay_signature?.trim() ?? "";

  if (!/^DOS-[0-9A-Z]{12}$/.test(ref)) {
    return json({ ok: false, error: "Unknown reference." }, 400, true);
  }

  // The whole trust boundary, in one call.
  let valid: boolean;
  try {
    valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, providedSignature);
  } catch {
    return json({ ok: false }, 500, true);
  }
  if (!valid) return json({ ok: false, error: "Invalid signature." }, 401, true);

  const order = await findOrderByRef(ref);
  if (!order) return json({ ok: false, error: "Unknown reference." }, 404, true);

  const q = sql();

  // Log the delivery, keyed on the payment id so a retry from a flaky mobile
  // connection is recorded once. Unlike the Razorpay handler we do not bail on
  // a duplicate - applyPaymentSuccess is idempotent, and returning the receipt
  // details again is exactly what a retrying client wants.
  await q`
    insert into webhook_events (source, event_id, event_type, payload)
    values ('originbi', ${razorpayPaymentId}, 'checkout.completed', ${JSON.stringify(body)}::jsonb)
    on conflict (source, event_id) do nothing
  `;

  const result = await applyPaymentSuccess({
    orderRef: ref,
    razorpayPaymentId,
    razorpayOrderId,
    method: typeof body.method === "string" ? body.method.slice(0, 40) : null,
  });

  if (!result) return json({ ok: false, error: "Could not record payment." }, 500, true);

  // Email is a side-effect. A Resend failure must not make this return non-2xx,
  // or originbi's page will look like the payment failed when it did not.
  if (result.created) {
    await deliverWelcomeEmail(result.order, result.membership);

    void notifyTeam(
      internalNotification({
        heading: "Membership payment received",
        pairs: [
          ["Member number", result.membership.member_no],
          ["Institution", result.membership.institution ?? "-"],
          ["Email", result.membership.email],
          ["Reference", result.order.order_ref],
          ["Transaction", razorpayPaymentId],
          ["Amount", formatInr(result.order.amount_paise)],
        ],
        adminUrl: `${env.siteUrl}/admin/payments/`,
      }),
      "payment",
    );
  }

  return json(
    {
      ok: true,
      orderRef: result.order.order_ref,
      memberNo: result.membership.member_no,
      // Lets originbi build the return URL without knowing our route shape.
      redirect: `${env.siteUrl}/membership/return/?ref=${encodeURIComponent(result.order.order_ref)}&payment=success`,
    },
    200,
    true,
  );
}

/** Preflight, since originbi calls this from a different origin. */
export async function OPTIONS() {
  return json({ ok: true }, 200, true);
}
