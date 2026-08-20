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
import { send } from "./email";
import { membershipActivated, membershipDetails } from "./email-templates";
import { getPlan, PLANS } from "./pricing";

/**
 * Sends the activation receipt exactly once per membership.
 *
 * The claim is a conditional UPDATE: whichever caller manages to flip
 * `welcome_email_sent_at` from null wins and sends. A concurrent caller sees
 * zero rows updated and does nothing. If the send then fails we clear the
 * stamp again, so the cron sweeper picks it up on the next pass.
 */
export async function deliverWelcomeEmail(
  order: Order,
  membership: Membership,
): Promise<{ sent: boolean; reason?: string }> {
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
      amountPaise: order.amount_paise,
      paidAt: order.paid_at ?? membership.activated_at,
      validUntil: membership.valid_until,
      plan,
      siteUrl: env.siteUrl,
    }),
  });

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
