/**
 * POST /api/membership/lookup  { ref } | { email }
 *
 * "Already a member? Check your status."
 *
 * The two inputs are deliberately not equivalent, because they are not equally
 * secret:
 *
 *  - **By reference** - `DOS-` plus 12 random characters is a bearer token
 *    only the buyer has. Full details are returned inline.
 *  - **By email** - an email address is guessable, so returning payment
 *    identifiers to whoever types one would be a data leak. Only a masked
 *    summary comes back inline; the full details are emailed to the address on
 *    the membership, so they reach the owner and nobody else.
 *
 * Note the residual trade-off: showing a masked summary does confirm that an
 * address is a member. That is accepted here because member institutions are
 * named publicly in the partner ecosystem anyway - what must not leak is the
 * reference and transaction IDs, and those are masked. Responses are
 * time-padded so the two branches are not distinguishable by latency.
 */

import type { NextRequest } from "next/server";
import { sql, type Membership, type Order } from "@/lib/db";
import { emailMembershipDetails, maskEmail, maskRef } from "@/lib/membership";
import { getPlan, gstBreakdown, PLANS } from "@/lib/pricing";
import { isEmail, normalizeEmail } from "@/lib/validate";
import { badRequest, clientIpHash, json, padTiming, rateLimit, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Joined = Membership & { order: Order };

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  if (!sameOrigin(req)) return badRequest("Request blocked.");

  let body: { ref?: string; email?: string };
  try {
    body = (await req.json()) as { ref?: string; email?: string };
  } catch {
    return badRequest("Malformed request.");
  }

  const limit = await rateLimit("membership-lookup", clientIpHash(req), {
    max: 15,
    windowMinutes: 15,
  });
  if (!limit.allowed) {
    return json(
      { ok: false, error: "Too many lookups from this connection. Please try again shortly." },
      429,
    );
  }

  const ref = body.ref?.trim().toUpperCase() ?? "";
  const email = body.email?.trim() ?? "";

  if (ref) return lookupByRef(ref, startedAt);
  if (email) return lookupByEmail(email, startedAt);

  return badRequest("Enter your email address or your reference ID.");
}

// ---------------------------------------------------------------------------

async function lookupByRef(ref: string, startedAt: number) {
  if (!/^DOS-[0-9A-Z]{12}$/.test(ref)) {
    await padTiming(startedAt);
    return json({ ok: true, found: false, mode: "ref" });
  }

  const rows = (await sql()`
    select m.*, row_to_json(o) as order
      from memberships m
      join orders o on o.id = m.order_id
     where o.order_ref = ${ref}
  `) as Joined[];

  const record = rows[0];

  // An order can exist without a membership - unpaid, failed or still
  // settling. Say so plainly rather than "not found", which would read as if
  // their payment had vanished.
  if (!record) {
    const orders = (await sql()`select * from orders where order_ref = ${ref}`) as Order[];
    await padTiming(startedAt);

    if (orders[0]) {
      return json({
        ok: true,
        found: false,
        mode: "ref",
        orderStatus: orders[0].status,
        orderRef: orders[0].order_ref,
      });
    }
    return json({ ok: true, found: false, mode: "ref" });
  }

  await padTiming(startedAt);
  return json({ ok: true, found: true, mode: "ref", membership: fullDetails(record) });
}

async function lookupByEmail(rawEmail: string, startedAt: number) {
  if (!isEmail(rawEmail)) {
    await padTiming(startedAt);
    return badRequest("Enter a valid email address.");
  }

  const email = normalizeEmail(rawEmail);

  const rows = (await sql()`
    select m.*, row_to_json(o) as order
      from memberships m
      join orders o on o.id = m.order_id
     where lower(m.email) = ${email}
     order by m.activated_at desc
     limit 1
  `) as Joined[];

  const record = rows[0];

  if (record) {
    // Best-effort: the masked summary is still shown if the send fails.
    await emailMembershipDetails(record.order, record).catch(() => undefined);
  }

  await padTiming(startedAt);

  return json({
    ok: true,
    mode: "email",
    found: Boolean(record),
    emailed: true,
    membership: record ? maskedDetails(record) : null,
  });
}

// ---------------------------------------------------------------------------

function amounts(order: Order, planId: string) {
  const plan = getPlan(planId) ?? PLANS["institution-annual"];
  return { plan, gst: gstBreakdown(order.amount_paise, plan.gstRate) };
}

function fullDetails(record: Joined) {
  const { plan, gst } = amounts(record.order, record.plan);

  return {
    memberNo: record.member_no,
    status: record.status,
    name: record.name,
    institution: record.institution,
    email: record.email,
    planName: plan.name,
    orderRef: record.order.order_ref,
    transactionId: record.order.razorpay_payment_id,
    paymentMethod: record.order.payment_method,
    purchasedAt: record.order.paid_at ?? record.activated_at,
    activatedAt: record.activated_at,
    validUntil: record.valid_until,
    amountPaise: gst.totalPaise,
    basePaise: gst.basePaise,
    gstPaise: gst.gstPaise,
    gstRate: gst.gstRate,
  };
}

function maskedDetails(record: Joined) {
  const { plan, gst } = amounts(record.order, record.plan);

  return {
    memberNo: record.member_no,
    status: record.status,
    institution: record.institution,
    email: maskEmail(record.email),
    planName: plan.name,
    orderRef: maskRef(record.order.order_ref),
    transactionId: maskRef(record.order.razorpay_payment_id),
    purchasedAt: record.order.paid_at ?? record.activated_at,
    validUntil: record.valid_until,
    amountPaise: gst.totalPaise,
  };
}
