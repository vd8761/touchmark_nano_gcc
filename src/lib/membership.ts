/**
 * Membership activation side-effects.
 *
 * `deliverWelcomeEmail` is called from three places - the Razorpay webhook, the
 * status poll's self-heal, and the cron sweeper. It must be safe to call on
 * every one of them, so the "has this already gone out?" check lives here
 * rather than being repeated (and eventually diverging) at each call site.
 */

import { sql, type Membership, type Order } from "./db";
import { env } from "./env";
import { send, notifyTeam } from "./email";
import { membershipActivated, membershipDetails, newMembershipNotification, welcomeEmail } from "./email-templates";
import { randomBytes } from "crypto";
import { hashPassword } from "./crypto";
import { getPlan, PLANS } from "./pricing";
import { getSettings } from "./settings";

/**
 * Sends the activation receipt exactly once per membership.
 *
 * The claim is a conditional UPDATE: whichever caller manages to flip
 * `welcome_email_sent_at` from null wins and sends. A concurrent caller sees
 * zero rows updated and does nothing. If the send then fails we clear the
 * stamp again, so the cron sweeper picks it up on the next pass.
 *
 * Gated on settings.sendUserCopy (the admin's "send buyers their own copy"
 * toggle). When it's off this is a pure no-op - `welcome_email_sent_at` is
 * left untouched, so turning the toggle back on lets the cron sweeper's
 * "unsent receipts" pass send it retroactively rather than losing it.
 */
export async function deliverWelcomeEmail(
  order: Order,
  membership: Membership,
): Promise<{ sent: boolean; reason?: string }> {
  const settings = await getSettings();
  if (!settings.sendUserCopy) return { sent: false, reason: "user-copy-disabled" };

  const q = sql();

  const claimed = (await q`
    update memberships
       set welcome_email_sent_at = now()
     where id = ${membership.id}
       and welcome_email_sent_at is null
    returning id
  `) as { id: string }[];

  if (!claimed.length) return { sent: false, reason: "already-sent" };

  const plan = getPlan(order.plan) ?? PLANS["institution-annual"];

  const result = await send({
    to: membership.email,
    template: "membership-activated",
    orderId: order.id,
    message: membershipActivated({
      name: membership.name,
      memberNo: membership.member_no,
      institution: membership.institution,
      email: membership.email,
      orderRef: order.order_ref,
      transactionId: order.razorpay_payment_id,
      bankReference: order.bank_reference,
      amountPaise: order.amount_paise,
      paidAt: order.paid_at ?? membership.activated_at,
      validUntil: membership.valid_until,
      plan,
      siteUrl: env.siteUrl,
    }),
  });

  // Automatically provision a portal login for the institution if one doesn't exist
  const existingUsers = await q`select id from admin_users where email = ${membership.email}`;
  if (existingUsers.length === 0) {
    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);
    
    await q`
      insert into admin_users (email, password_hash, name, role)
      values (${membership.email}, ${tempPasswordHash}, ${membership.institution}, 'COLLEGE')
      on conflict (email) do nothing
    `;

    // Send the welcome credentials
    await send({
      to: membership.email,
      template: "welcome-institution",
      message: welcomeEmail({
        roleDisplay: "Academic Partner",
        name: membership.name || "Partner",
        email: membership.email,
        tempPassword: tempPassword,
        loginUrl: `${env.siteUrl}/portal/login`,
      }),
    }).catch(console.error); // Best-effort, don't fail the receipt delivery
  }

  if (!result.ok) {
    // Release the claim so this is retried rather than silently lost.
    await q`update memberships set welcome_email_sent_at = null where id = ${membership.id}`;
    return { sent: false, reason: result.error };
  }

  return { sent: true };
}

/** Resends the receipt on demand, from the admin panel. Bypasses the once-only claim. */
export async function resendWelcomeEmail(order: Order, membership: Membership) {
  const plan = getPlan(order.plan) ?? PLANS["institution-annual"];

  return send({
    to: membership.email,
    template: "membership-activated-resend",
    orderId: order.id,
    message: membershipActivated({
      name: membership.name,
      memberNo: membership.member_no,
      institution: membership.institution,
      email: membership.email,
      orderRef: order.order_ref,
      transactionId: order.razorpay_payment_id,
      bankReference: order.bank_reference,
      amountPaise: order.amount_paise,
      paidAt: order.paid_at ?? membership.activated_at,
      validUntil: membership.valid_until,
      plan,
      siteUrl: env.siteUrl,
    }),
  });
}

/** Emails full membership details in response to an email-based status lookup. */
export async function emailMembershipDetails(order: Order, membership: Membership) {
  const plan = getPlan(order.plan) ?? PLANS["institution-annual"];

  return send({
    to: membership.email,
    template: "membership-details",
    orderId: order.id,
    message: membershipDetails({
      name: membership.name,
      memberNo: membership.member_no,
      institution: membership.institution,
      email: membership.email,
      orderRef: order.order_ref,
      transactionId: order.razorpay_payment_id,
      bankReference: order.bank_reference,
      amountPaise: order.amount_paise,
      paidAt: order.paid_at ?? membership.activated_at,
      validUntil: membership.valid_until,
      status: membership.status,
      plan,
      siteUrl: env.siteUrl,
    }),
  });
}

/**
 * Notifies the team about a new membership - the admin's counterpart to
 * `deliverWelcomeEmail`. Called from both completion webhooks, which is why
 * this lives here rather than being built inline at each call site as it
 * used to be: the two had already started drifting (one used the buyer's
 * name for its own audit trail purposes, the other didn't) despite meaning
 * the same event.
 *
 * The designation, city and "anything else we should know" message aren't on
 * `orders`/`memberships` - only the enquiry has them - so this looks the
 * enquiry up by `order.enquiry_id` for that context. A gone or missing
 * enquiry degrades gracefully to blanks rather than failing the whole send.
 */
export async function notifyNewMembership(order: Order, membership: Membership): Promise<void> {
  let role: string | null = null;
  let city: string | null = null;
  let message: string | null = null;

  if (order.enquiry_id) {
    const rows = (await sql()`
      select role, city, message from enquiries where id = ${order.enquiry_id}
    `) as { role: string | null; city: string | null; message: string | null }[];
    role = rows[0]?.role ?? null;
    city = rows[0]?.city ?? null;
    message = rows[0]?.message ?? null;
  }

  await notifyTeam(
    newMembershipNotification({
      name: membership.name,
      institution: membership.institution,
      email: membership.email,
      phone: order.phone,
      role,
      city,
      message,
      memberNo: membership.member_no,
      orderRef: order.order_ref,
      transactionId: order.razorpay_payment_id,
      bankReference: order.bank_reference,
      amountPaise: order.amount_paise,
      paidAt: order.paid_at ?? membership.activated_at,
      adminUrl: `${env.siteUrl}/admin/payments/`,
    }),
    "payment",
  );
}

/**
 * Partially redacts an identifier for display.
 *
 * `DOS-A1B2C3D4E5F6` -> `DOS-••••••••E5F6`. Enough for the owner to recognise
 * their own reference, not enough for anyone else to use it.
 */
export function maskRef(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 6) return "••••";

  const tail = value.slice(-4);
  const head = value.startsWith("DOS-") ? "DOS-" : value.slice(0, 4);
  return `${head}${"•".repeat(Math.max(4, value.length - head.length - 4))}${tail}`;
}

/** `member@institution.edu` -> `me••••@institution.edu`. */
export function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return "••••";
  const head = local.slice(0, 2);
  return `${head}${"•".repeat(Math.max(2, local.length - 2))}@${domain}`;
}
