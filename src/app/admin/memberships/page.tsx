import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatInr } from "@/lib/pricing";
import { EmptyState, formatDate, StatusPill } from "@/components/admin/ui";
import styles from "@/app/admin/dashboard/dashboard.module.css";
import Link from "next/link";
import { Plus } from "lucide-react";

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
    <div className={styles.dashboardContainer} style={{ zoom: 1 }}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Institutions</h1>
          <p className={styles.pageSubtitle}>
            Active and past Nano GCC memberships. Every row here corresponds to a payment Razorpay
            confirmed or a manually created institution.
          </p>
        </div>
        <Link href="/admin/memberships/new" className={styles.primaryActionBtn} style={{ textDecoration: 'none' }}>
          <Plus size={16} /> Add Institution
        </Link>
      </div>

      <div className={styles.bottomCard} style={{ padding: '24px', marginBottom: '8px' }}>
        <form className="adm-tools" method="get" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
          <div className="field" style={{ flex: 1, minWidth: 240, margin: 0 }}>
            <label htmlFor="q" style={{ fontWeight: 600, color: '#64748B', fontSize: '0.8rem', marginBottom: '8px', display: 'block' }}>Search</label>
            <input id="q" name="q" defaultValue={search} placeholder="Member number, institution or email" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <button className={styles.primaryActionBtn} type="submit" style={{ margin: 0, height: '42px', padding: '0 24px' }}>Apply</button>
            <a href="/admin/memberships/" className={styles.refreshBtn} style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 20px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', textDecoration: 'none' }}>Clear</a>
            <a href="/api/admin/export?type=memberships" className={styles.refreshBtn} style={{ height: '42px', display: 'flex', alignItems: 'center', padding: '0 20px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', textDecoration: 'none' }}>Export CSV</a>
          </div>
        </form>
      </div>

      <div className={styles.bottomCard} style={{ padding: 0, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <EmptyState>No memberships yet.</EmptyState>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table" style={{ margin: 0, border: 'none' }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Member no.</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Institution</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Contact</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Email</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Activated</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Valid until</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Receipt</th>
                  <th style={{ padding: '16px', color: '#64748B', fontWeight: 600, fontSize: '0.75rem', borderBottom: '1px solid #E2E8F0' }}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.member_no}>
                    <td className="mono" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{row.member_no}</td>
                    <td className="wrap" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{row.institution ?? "-"}</td>
                    <td className="wrap" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{row.name ?? "-"}</td>
                    <td className="wrap" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{row.email}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}><StatusPill status={row.status} /></td>
                    <td className="mono" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{formatInr(row.amount_paise)}</td>
                    <td className="mono" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{formatDate(row.activated_at)}</td>
                    <td className="mono" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{formatDate(row.valid_until)}</td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}><StatusPill status={row.welcome_email_sent_at ? "sent" : "pending"} /></td>
                    <td className="mono" style={{ padding: '16px', borderBottom: '1px solid #F1F5F9' }}>{row.order_ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
