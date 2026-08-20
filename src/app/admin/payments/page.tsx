import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatInr } from "@/lib/pricing";
import { EmptyState, formatDate, StatusPill } from "@/components/admin/ui";
import OrderActions from "@/components/admin/OrderActions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Row = {
  order_ref: string;
  email: string;
  name: string | null;
  organization: string | null;
  status: string;
  amount_paise: number;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  payment_method: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  member_no: string | null;
  welcome_email_sent_at: string | null;
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const status = params.status ?? null;
  const search = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const rows = (await sql()`
    select o.order_ref, o.email, o.name, o.organization, o.status, o.amount_paise,
           o.razorpay_payment_id, o.razorpay_order_id, o.payment_method, o.failure_reason,
           o.paid_at, o.created_at,
           m.member_no, m.welcome_email_sent_at
      from orders o
      left join memberships m on m.order_id = o.id
     where (${status}::text is null or o.status = ${status})
       and (${search || null}::text is null
            or lower(o.email) like '%' || lower(${search}) || '%'
            or lower(coalesce(o.organization, '')) like '%' || lower(${search}) || '%'
            or upper(o.order_ref) like '%' || upper(${search}) || '%'
            or lower(coalesce(o.razorpay_payment_id, '')) like '%' || lower(${search}) || '%')
     order by o.created_at desc
     limit ${PAGE_SIZE + 1} offset ${(page - 1) * PAGE_SIZE}
  `) as Row[];

  const hasMore = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);

  return (
    <>
      <h1 className="adm-h1">Payments</h1>
      <p className="adm-sub">
        Every payment attempt, settled or not. <strong>Re-check</strong> asks Razorpay what actually
        happened and applies the answer &mdash; it is the only way status changes from here, and it
        cannot invent a payment that didn&rsquo;t occur.
      </p>

      <form className="adm-tools" method="get">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""}>
            <option value="">All</option>
            <option value="created">Created</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={search} placeholder="Reference, email, institution or transaction ID" />
        </div>

        <button className="adm-btn" type="submit">
          Apply
        </button>
        <a className="adm-btn ghost" href="/admin/payments/">
          Clear
        </a>
        <a className="adm-btn ghost" href="/api/admin/export?type=payments">
          Export CSV
        </a>
      </form>

      {visible.length === 0 ? (
        <EmptyState>No payments match those filters.</EmptyState>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Status</th>
                <th>Institution</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Transaction</th>
                <th>Member no.</th>
                <th>Receipt</th>
                <th>Started</th>
                <th>Paid</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.order_ref}>
                  <td className="mono">{row.order_ref}</td>
                  <td>
                    <StatusPill status={row.status} />
                    {row.failure_reason && (
                      <div style={{ color: "var(--ink-faint)", fontSize: "0.74rem", marginTop: 5 }}>
                        {row.failure_reason}
                      </div>
                    )}
                  </td>
                  <td className="wrap">{row.organization ?? "-"}</td>
                  <td className="wrap">{row.email}</td>
                  <td className="mono">{formatInr(row.amount_paise)}</td>
                  <td className="mono">{row.razorpay_payment_id ?? "-"}</td>
                  <td className="mono">{row.member_no ?? "-"}</td>
                  <td>
                    {row.member_no ? (
                      <StatusPill status={row.welcome_email_sent_at ? "sent" : "pending"} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="mono">{formatDate(row.created_at)}</td>
                  <td className="mono">{formatDate(row.paid_at)}</td>
                  <td>
                    <OrderActions orderRef={row.order_ref} hasMembership={Boolean(row.member_no)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="adm-tools" style={{ marginTop: 22, marginBottom: 0 }}>
          {page > 1 && (
            <a className="adm-btn ghost" href={pageLink(params, page - 1)}>
              Previous
            </a>
          )}
          <span style={{ alignSelf: "center", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
            Page {page}
          </span>
          {hasMore && (
            <a className="adm-btn ghost" href={pageLink(params, page + 1)}>
              Next
            </a>
          )}
        </div>
      )}
    </>
  );
}

function pageLink(params: Record<string, string | undefined>, target: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") query.set(key, value);
  }
  if (target > 1) query.set("page", String(target));
  return `/admin/payments/${query.toString() ? `?${query}` : ""}`;
}
