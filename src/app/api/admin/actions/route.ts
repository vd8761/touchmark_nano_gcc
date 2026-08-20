/**
 * POST /api/admin/actions
 *
 * The small set of mutations the admin panel is allowed to perform.
 *
 * Note what is *absent*: nothing here changes an amount, marks an order paid,
 * or creates a membership by hand. Money state is only ever written by
 * Razorpay's answer, via `reconcileOrder`. The panel can ask that question
 * again ("recheck"), but it cannot invent the answer.
 */

import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql, type Order } from "@/lib/db";
import { findMembershipByOrderId, findOrderByRef, reconcileOrder } from "@/lib/payments";
import { resendWelcomeEmail } from "@/lib/membership";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { clean, LIMITS } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENQUIRY_STATUSES = ["new", "contacted", "qualified", "won", "closed"];

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  const admin = await currentAdmin();
  if (!admin) return json({ ok: false, error: "Not signed in." }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return badRequest("Malformed request.");
  }

  switch (body.action) {
    case "update-enquiry":
      return updateEnquiry(body);
    case "recheck-order":
      return recheckOrder(body);
    case "resend-receipt":
      return resendReceipt(body);
    default:
      return badRequest("Unknown action.");
  }
}

/** Triage fields only - never the submitted contact details themselves. */
async function updateEnquiry(body: Record<string, unknown>) {
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id) return badRequest("Missing enquiry.");
  if (status && !ENQUIRY_STATUSES.includes(status)) return badRequest("Unknown status.");

  await sql()`
    update enquiries
       set status      = coalesce(nullif(${status}, ''), status),
           admin_notes = coalesce(${clean(body.notes, LIMITS.message)}, admin_notes)
     where id = ${id}
  `;

  return json({ ok: true });
}

/** Re-asks Razorpay about one order and applies whatever it says. */
async function recheckOrder(body: Record<string, unknown>) {
  const ref = typeof body.ref === "string" ? body.ref : "";
  const order = ref ? await findOrderByRef(ref) : null;
  if (!order) return json({ ok: false, error: "Unknown order." }, 404);

  const settled: Order = await reconcileOrder(order);
  return json({ ok: true, status: settled.status });
}

async function resendReceipt(body: Record<string, unknown>) {
  const ref = typeof body.ref === "string" ? body.ref : "";
  const order = ref ? await findOrderByRef(ref) : null;
  if (!order) return json({ ok: false, error: "Unknown order." }, 404);

  const membership = await findMembershipByOrderId(order.id);
  if (!membership) return json({ ok: false, error: "No membership on this order." }, 404);

  const result = await resendWelcomeEmail(order, membership);
  return result.ok
    ? json({ ok: true })
    : json({ ok: false, error: result.error }, 502);
}
