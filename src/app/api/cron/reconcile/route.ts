/**
 * GET /api/cron/reconcile  (Vercel Cron, daily - see vercel.json)
 *
 * Daily because Vercel's Hobby plan caps cron jobs to once a day; upgrade to
 * Pro and tighten the schedule in vercel.json if a shorter worst-case matters
 * more than the cost. The 20-second self-heal in /api/order-status covers the
 * common case regardless - a buyer who checks their own status shortly after
 * paying never depends on this cron at all.
 *
 * The backstop. Everything else in the payment path is best-effort; this is
 * what makes "we never lose a payment" true rather than aspirational.
 *
 * Three sweeps:
 *  1. Unconfirmed orders older than 10 minutes -> ask Razorpay directly.
 *  2. Paid orders whose receipt never went out -> send it.
 *  3. Orders still unconfirmed after 24 hours -> mark abandoned, so they stop
 *     being swept forever. Never applied to anything Razorpay called paid.
 *
 * Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
 */

import type { NextRequest } from "next/server";
import { sql, type Membership, type Order } from "@/lib/db";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { reconcileOrder } from "@/lib/payments";
import { deliverWelcomeEmail } from "@/lib/membership";
import { json } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Bounded per run so a backlog can never blow the function time limit. */
const BATCH = 25;

export async function GET(req: NextRequest) {
  const provided = req.headers.get("authorization") ?? "";
  let expected: string;
  try {
    expected = `Bearer ${env.cronSecret}`;
  } catch {
    return json({ ok: false }, 500);
  }
  if (!safeEqual(provided, expected)) return json({ ok: false }, 401);

  const q = sql();
  const summary = { reconciled: 0, becamePaid: 0, emailsSent: 0, abandoned: 0 };

  // --- 1. Unconfirmed orders that a webhook should have settled by now. ----
  const pending = (await q`
    select * from orders
     where status in ('created', 'pending')
       and created_at < now() - interval '10 minutes'
       and created_at > now() - interval '7 days'
     order by created_at asc
     limit ${BATCH}
  `) as Order[];

  for (const order of pending) {
    const settled = await reconcileOrder(order);
    summary.reconciled++;
    if (settled.status === "paid") summary.becamePaid++;
  }

  // --- 2. Paid memberships whose receipt never made it out. ----------------
  // Covers a Resend outage, and the narrow window where the process died
  // between marking an order paid and sending its email.
  const unsent = (await q`
    select m.*, row_to_json(o) as order
      from memberships m
      join orders o on o.id = m.order_id
     where m.welcome_email_sent_at is null
       and o.status = 'paid'
     order by m.activated_at asc
     limit ${BATCH}
  `) as (Membership & { order: Order })[];

  for (const membership of unsent) {
    const result = await deliverWelcomeEmail(membership.order, membership);
    if (result.sent) summary.emailsSent++;
  }

  // --- 3. Retire genuinely dead attempts. ----------------------------------
  // `status <> 'paid'` is redundant given the filter, but it is the kind of
  // redundancy worth keeping in a statement that writes to the payment table.
  const abandoned = (await q`
    update orders
       set status = 'abandoned'
     where status in ('created', 'pending')
       and status <> 'paid'
       and created_at < now() - interval '24 hours'
    returning id
  `) as { id: string }[];

  summary.abandoned = abandoned.length;

  // --- 4. Prune the rate-limit table. --------------------------------------
  // Every limiter writes a row, and the return page polls up to ~45 times per
  // payment, so this grows fast. Nothing older than a day is consulted by any
  // window we use.
  await q`delete from admin_login_attempts where created_at < now() - interval '1 day'`;

  return json({ ok: true, ...summary });
}
