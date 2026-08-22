/**
 * The payment layer.
 *
 * Design rule for this whole file: **the webhook is the source of truth, the
 * browser redirect is only UX.** Every state change funnels through
 * `applyPaymentSuccess` / `applyPaymentFailure`, so the webhook, the status
 * poll's self-heal and the cron sweeper cannot disagree about what "paid"
 * means. All three are safe to run repeatedly on the same order.
 */

import { sql, type Order, type Membership } from "./db";
import { env } from "./env";
import { generateOrderRef, hmacHex, safeEqual } from "./crypto";
import { signJwt } from "./jwt";
import { getPlan, type PlanId } from "./pricing";
import { getCurrentAmountPaise } from "./settings";

/**
 * Razorpay's REST base. Overridable so the local Docker stack can substitute a
 * mock gateway; unset everywhere else, so production always hits the real one.
 */
const RAZORPAY_API = process.env.RAZORPAY_API_BASE ?? "https://api.razorpay.com/v1";

/** Tag on the Razorpay order so we ignore originbi's own unrelated traffic. */
export const SITE_TAG = "nanogcc";

/** How long an unpaid order stays reusable before we mint a fresh one. */
const REUSE_WINDOW_MINUTES = 30;

// ---------------------------------------------------------------------------
// Creating an order
// ---------------------------------------------------------------------------

type CreateOrderInput = {
  enquiryId: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  organization: string | null;
  plan: PlanId;
};

/**
 * Returns the order to send the buyer to checkout with.
 *
 * If this email already has an unpaid order from the last half hour, that one
 * is handed back instead of a new one. A double-clicked submit button or a
 * back-then-resubmit therefore produces one order, not two.
 */
export async function createOrReuseOrder(input: CreateOrderInput): Promise<Order> {
  const plan = getPlan(input.plan);
  if (!plan) throw new Error(`Unknown plan: ${input.plan}`);

  const q = sql();

  const existing = (await q`
    select * from orders
     where lower(email) = lower(${input.email})
       and plan = ${plan.id}
       and status in ('created', 'pending')
       and retried_by is null
       and created_at > now() - (${REUSE_WINDOW_MINUTES} || ' minutes')::interval
     order by created_at desc
     limit 1
  `) as Order[];

  if (existing[0]) return existing[0];

  // The live price, not the pricing.ts constant - picks up whatever is
  // currently set in /admin/settings, if anything.
  const amountPaise = await getCurrentAmountPaise(plan.id);

  const rows = (await q`
    insert into orders (order_ref, enquiry_id, email, name, phone, organization, plan, amount_paise, currency)
    values (${generateOrderRef()}, ${input.enquiryId}, ${input.email}, ${input.name}, ${input.phone},
            ${input.organization}, ${plan.id}, ${amountPaise}, ${plan.currency})
    returning *
  `) as Order[];

  return rows[0]!;
}

/**
 * Mints a replacement order for a failed attempt and links the two, so the old
 * ref stops being reused and the retry history stays visible in the admin panel.
 */
export async function createRetryOrder(previous: Order): Promise<Order> {
  const q = sql();

  const rows = (await q`
    insert into orders (order_ref, enquiry_id, email, name, phone, organization, plan, amount_paise, currency)
    values (${generateOrderRef()}, ${previous.enquiry_id}, ${previous.email}, ${previous.name},
            ${previous.phone}, ${previous.organization}, ${previous.plan}, ${previous.amount_paise},
            ${previous.currency})
    returning *
  `) as Order[];

  const retry = rows[0]!;
  await q`update orders set retried_by = ${retry.id} where id = ${previous.id}`;
  return retry;
}

// ---------------------------------------------------------------------------
// Handoff to originbi.com
// ---------------------------------------------------------------------------

/**
 * Builds the cross-domain checkout URL.
 *
 * Razorpay's live gateway is approved for originbi.com only, so buyers are
 * handed there to pay and returned here afterwards. Everything originbi needs
 * travels inside a JWT signed with the shared `CROSS_DOMAIN_SECRET` - notably
 * the amount, which is therefore set by this server and cannot be edited in an
 * address bar.
 *
 * `callback` and `notify` are in the token rather than hardcoded on originbi's
 * side, so the same checkout page can serve more than one product.
 */
export function buildCheckoutUrl(order: Order): string {
  const token = signJwt(
    {
      ref: order.order_ref,
      amount: order.amount_paise,
      currency: order.currency,
      name: order.name ?? "",
      email: order.email,
      phone: order.phone ?? "",
      organization: order.organization ?? "",
      tier: order.plan,
      callback: `${env.siteUrl}/membership/return/`,
      notify: `${env.siteUrl}/api/webhooks/originbi`,
    },
    env.crossDomainSecret,
    // Long enough to fill in a card, short enough that a copied link dies.
    15 * 60,
  );

  const url = new URL(env.originbiCheckoutUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Verifies a Razorpay client-side payment signature.
 *
 * This is the `razorpay_signature` the checkout modal hands back, computed as
 * HMAC-SHA256 of `order_id|payment_id` keyed with the API secret. It proves
 * the payment genuinely succeeded, so a forged POST to our completion endpoint
 * cannot mint a membership.
 *
 * Note this is a *different* signature from the webhook's, which is taken over
 * the whole raw request body with the webhook secret. Both are checked, in
 * their respective handlers.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  providedSignature: string,
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !providedSignature) return false;

  const expected = hmacHex(`${razorpayOrderId}|${razorpayPaymentId}`, env.razorpayKeySecret);
  return safeEqual(providedSignature, expected);
}

// ---------------------------------------------------------------------------
// State transitions - the only places an order becomes paid or failed
// ---------------------------------------------------------------------------

type SuccessInput = {
  orderRef: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string | null;
  method?: string | null;
  amountPaise?: number | null;
};

export type SuccessResult = {
  order: Order;
  membership: Membership;
  /** False when this call was a replay and the membership already existed. */
  created: boolean;
};

/**
 * Marks an order paid and activates its membership. Idempotent.
 *
 * Written as three guarded statements rather than one clever CTE, because the
 * guarantees here need to be obvious on inspection:
 *
 *  1. The order update is conditional on `status <> 'paid'`, so it applies once.
 *  2. The membership insert is `on conflict (order_id) do nothing`, and
 *     `memberships.order_id` is UNIQUE - so even two webhook deliveries racing
 *     in parallel produce exactly one membership.
 *  3. `created` reflects whether *this* call inserted it, which is what gates
 *     the welcome email.
 *
 * A crash between steps 1 and 2 leaves a paid order with no membership; the
 * cron sweeper re-runs this and completes it.
 */
export async function applyPaymentSuccess(input: SuccessInput): Promise<SuccessResult | null> {
  const q = sql();

  // 1. Mark paid, but never overwrite identifiers we already recorded.
  await q`
    update orders
       set status              = 'paid',
           razorpay_payment_id = coalesce(razorpay_payment_id, ${input.razorpayPaymentId}),
           razorpay_order_id   = coalesce(${input.razorpayOrderId ?? null}, razorpay_order_id),
           payment_method      = coalesce(${input.method ?? null}, payment_method),
           paid_at             = coalesce(paid_at, now()),
           failure_reason      = null
     where order_ref = ${input.orderRef}
       and status <> 'paid'
  `;

  const orders = (await q`select * from orders where order_ref = ${input.orderRef}`) as Order[];
  const order = orders[0];
  if (!order || order.status !== "paid") return null;

  // 2. Activate the membership. The unique constraint does the deduplication.
  const inserted = (await q`
    insert into memberships (order_id, member_no, email, name, institution, plan, valid_until)
    values (
      ${order.id},
      'DOS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('member_no_seq')::text, 4, '0'),
      ${order.email}, ${order.name}, ${order.organization}, ${order.plan},
      now() + interval '12 months'
    )
    on conflict (order_id) do nothing
    returning *
  `) as Membership[];

  if (inserted[0]) return { order, membership: inserted[0], created: true };

  // 3. Replay: the membership was already there.
  const existing = (await q`
    select * from memberships where order_id = ${order.id}
  `) as Membership[];

  return existing[0] ? { order, membership: existing[0], created: false } : null;
}

/**
 * Records a failed attempt.
 *
 * Guarded on `status <> 'paid'`: a late-arriving `payment.failed` for an
 * earlier attempt must never undo a payment that has since succeeded.
 */
export async function applyPaymentFailure(
  orderRef: string,
  reason: string | null,
  razorpayOrderId?: string | null,
): Promise<Order | null> {
  const q = sql();

  const rows = (await q`
    update orders
       set status            = 'failed',
           failure_reason    = ${reason},
           razorpay_order_id = coalesce(${razorpayOrderId ?? null}, razorpay_order_id)
     where order_ref = ${orderRef}
       and status not in ('paid', 'abandoned')
    returning *
  `) as Order[];

  if (rows[0]) return rows[0];

  const current = (await q`select * from orders where order_ref = ${orderRef}`) as Order[];
  return current[0] ?? null;
}

// ---------------------------------------------------------------------------
// Reconciliation - the safety net when a webhook never arrives
// ---------------------------------------------------------------------------

type RazorpayPayment = {
  id: string;
  status: string;
  amount: number;
  method?: string;
  order_id?: string;
  error_description?: string;
  notes?: Record<string, string>;
};

async function razorpayFetch<T>(path: string): Promise<T | null> {
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64");

  const res = await fetch(`${RAZORPAY_API}${path}`, {
    headers: { authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * Asks Razorpay directly what happened to an order, and applies the answer.
 *
 * Called from the status poll (after a short grace period) and from the cron
 * sweeper. This is what guarantees a payment is never lost just because a
 * webhook was dropped.
 */
export async function reconcileOrder(order: Order): Promise<Order> {
  if (order.status === "paid") return order;

  try {
    // Prefer the Razorpay order we already know about; otherwise search by the
    // receipt, which originbi sets to our order_ref.
    let razorpayOrderId = order.razorpay_order_id;

    if (!razorpayOrderId) {
      const search = await razorpayFetch<{ items: { id: string; receipt?: string }[] }>(
        `/orders?count=20&receipt=${encodeURIComponent(order.order_ref)}`,
      );
      razorpayOrderId = search?.items?.find((o) => o.receipt === order.order_ref)?.id ?? null;
      if (!razorpayOrderId) return order;

      await sql()`update orders set razorpay_order_id = ${razorpayOrderId} where id = ${order.id}`;
    }

    const payments = await razorpayFetch<{ items: RazorpayPayment[] }>(
      `/orders/${razorpayOrderId}/payments`,
    );
    if (!payments?.items?.length) return order;

    const captured = payments.items.find((p) => p.status === "captured" || p.status === "authorized");

    if (captured) {
      const result = await applyPaymentSuccess({
        orderRef: order.order_ref,
        razorpayPaymentId: captured.id,
        razorpayOrderId,
        method: captured.method ?? null,
      });
      return result?.order ?? order;
    }

    const failed = payments.items.find((p) => p.status === "failed");
    if (failed) {
      return (
        (await applyPaymentFailure(
          order.order_ref,
          failed.error_description ?? "Payment failed",
          razorpayOrderId,
        )) ?? order
      );
    }

    return order;
  } catch {
    // Reconciliation is best-effort. A Razorpay outage must not turn a pending
    // order into an error for the buyer - the cron sweeper will try again.
    return order;
  }
}

export async function findOrderByRef(orderRef: string): Promise<Order | null> {
  const rows = (await sql()`select * from orders where order_ref = ${orderRef}`) as Order[];
  return rows[0] ?? null;
}

export async function findMembershipByOrderId(orderId: string): Promise<Membership | null> {
  const rows = (await sql()`
    select * from memberships where order_id = ${orderId}
  `) as Membership[];
  return rows[0] ?? null;
}
