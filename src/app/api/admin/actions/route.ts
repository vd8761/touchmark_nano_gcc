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
import { send } from "@/lib/email";
import { internalNotification } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { clean, isEmail, LIMITS } from "@/lib/validate";
import { getSettings, notifyRecipients, parseEmailList, updateSettings } from "@/lib/settings";

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
    case "update-settings":
      return updateSettingsAction(body);
    case "send-test-notification":
      return sendTestNotification(admin.email);
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

/** Free-text lists (one address per line, or comma-separated) -> validated arrays. */
function parseListField(body: Record<string, unknown>, key: string): string[] | { error: string } {
  const raw = typeof body[key] === "string" ? body[key] : "";
  const addresses = parseEmailList(raw);
  const bad = addresses.find((a) => !isEmail(a));
  if (bad) return { error: `"${bad}" doesn't look like a valid email address.` };
  return addresses;
}

async function updateSettingsAction(body: Record<string, unknown>) {
  const adminNotifyEmails = parseListField(body, "adminNotifyEmails");
  if ("error" in adminNotifyEmails) return badRequest(adminNotifyEmails.error);

  const cc = parseListField(body, "cc");
  if ("error" in cc) return badRequest(cc.error);

  const bcc = parseListField(body, "bcc");
  if ("error" in bcc) return badRequest(bcc.error);

  const fromEmail = clean(body.fromEmail, LIMITS.email) ?? "";
  if (fromEmail && !isEmail(fromEmail)) return badRequest("From address doesn't look like a valid email.");

  const replyTo = clean(body.replyTo, LIMITS.email) ?? "";
  if (replyTo && !isEmail(replyTo)) return badRequest("Reply-to doesn't look like a valid email.");

  const settings = await updateSettings({
    adminNotifyEmails,
    fromName: clean(body.fromName, LIMITS.name),
    fromEmail: fromEmail || null,
    replyTo: replyTo || null,
    cc,
    bcc,
    notifyAdminEnquiry: body.notifyAdminEnquiry === true,
    notifyAdminPayment: body.notifyAdminPayment === true,
    sendUserCopy: body.sendUserCopy === true,
  });

  return json({ ok: true, settings });
}

/**
 * Sends one internal-notification email right now, using whatever is
 * currently saved - deliberately via `send()` directly rather than
 * `notifyTeam()`, so it ignores the enable/disable toggles: the point of a
 * test send is "does this configuration actually deliver", independent of
 * whether the admin has that category of notification switched on.
 */
async function sendTestNotification(adminEmail: string) {
  const settings = await getSettings();

  const result = await send({
    to: notifyRecipients(settings),
    template: "internal-notification-test",
    cc: settings.cc,
    bcc: settings.bcc,
    message: internalNotification({
      heading: "Test notification",
      pairs: [
        ["Sent by", adminEmail],
        ["Sent at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
      ],
      adminUrl: `${env.siteUrl}/admin/settings/`,
    }),
  });

  return result.ok ? json({ ok: true }) : json({ ok: false, error: result.error }, 502);
}
