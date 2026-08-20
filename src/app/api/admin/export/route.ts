/**
 * GET /api/admin/export?type=enquiries|payments|memberships
 *
 * CSV download for the admin tables. Session-guarded like everything else
 * under /api/admin.
 */

import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { json } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUERIES = {
  enquiries: () => sql()`
    select created_at, kind, name, email, organization, phone, role, city, team_size,
           interest, message, status, admin_notes
      from enquiries order by created_at desc limit 5000
  `,
  payments: () => sql()`
    select o.created_at, o.order_ref, o.status, o.organization, o.name, o.email,
           o.amount_paise / 100.0 as amount_inr, o.razorpay_order_id, o.razorpay_payment_id,
           o.payment_method, o.failure_reason, o.paid_at, m.member_no
      from orders o left join memberships m on m.order_id = o.id
     order by o.created_at desc limit 5000
  `,
  memberships: () => sql()`
    select m.member_no, m.institution, m.name, m.email, m.status, m.activated_at,
           m.valid_until, m.welcome_email_sent_at, o.order_ref, o.razorpay_payment_id,
           o.amount_paise / 100.0 as amount_inr
      from memberships m join orders o on o.id = m.order_id
     order by m.activated_at desc limit 5000
  `,
} as const;

export async function GET(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return json({ ok: false, error: "Not signed in." }, 401);

  const type = req.nextUrl.searchParams.get("type") ?? "";
  const query = QUERIES[type as keyof typeof QUERIES];
  if (!query) return json({ ok: false, error: "Unknown export." }, 400);

  const rows = (await query()) as Record<string, unknown>[];
  const date = new Date().toISOString().slice(0, 10);

  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="dosclub-${type}-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(","));
  }

  // BOM so Excel opens UTF-8 (rupee signs, accented names) correctly.
  return `﻿${lines.join("\r\n")}`;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = value instanceof Date ? value.toISOString() : String(value);

  // Leading =, +, - or @ makes Excel treat a cell as a formula. Prefix with an
  // apostrophe so a name like "-Ravi" can't become an injection vector in
  // whatever spreadsheet this is opened in.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return `"${safe.replace(/"/g, '""')}"`;
}
