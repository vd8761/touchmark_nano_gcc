import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatInr } from "@/lib/pricing";
import { EmptyState, formatDate, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Row = {
  member_no: string;
  institution: string | null;
  name: string | null;
  email: string;
  status: string;
  activated_at: string;
  valid_until: string | null;
  welcome_email_sent_at: string | null;
  order_ref: string;
  amount_paise: number;
};

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();

  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  const rows = (await sql()`
    select m.member_no, m.institution, m.name, m.email, m.status, m.activated_at,
           m.valid_until, m.welcome_email_sent_at, o.order_ref, o.amount_paise
      from memberships m
      join orders o on o.id = m.order_id
     where (${search || null}::text is null
            or lower(m.email) like '%' || lower(${search}) || '%'
            or lower(coalesce(m.institution, '')) like '%' || lower(${search}) || '%'
            or upper(m.member_no) like '%' || upper(${search}) || '%')
     order by m.activated_at desc
     limit 200
  `) as Row[];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 className="adm-h1">Institutions</h1>
          <p className="adm-sub" style={{ margin: 0 }}>
            Active and past Nano GCC memberships. Every row here corresponds to a payment Razorpay
            confirmed or a manually created institution.
          </p>
        </div>
        <div className="acts">
          <a href="/admin/memberships/new" className="act primary">
            + Add Institution
          </a>
        </div>
      </div>

      <form className="adm-tools" method="get">
        <div className="field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={search} placeholder="Member number, institution or email" />
        </div>
        <button className="adm-btn" type="submit">Apply</button>
        <a className="adm-btn ghost" href="/admin/memberships/">Clear</a>
        <a className="adm-btn ghost" href="/api/admin/export?type=memberships">Export CSV</a>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No memberships yet.</EmptyState>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Member no.</th>
                <th>Institution</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Activated</th>
                <th>Valid until</th>
                <th>Receipt</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.member_no}>
                  <td className="mono">{row.member_no}</td>
                  <td className="wrap">{row.institution ?? "-"}</td>
                  <td className="wrap">{row.name ?? "-"}</td>
                  <td className="wrap">{row.email}</td>
                  <td><StatusPill status={row.status} /></td>
                  <td className="mono">{formatInr(row.amount_paise)}</td>
                  <td className="mono">{formatDate(row.activated_at)}</td>
                  <td className="mono">{formatDate(row.valid_until)}</td>
                  <td><StatusPill status={row.welcome_email_sent_at ? "sent" : "pending"} /></td>
                  <td className="mono">{row.order_ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
