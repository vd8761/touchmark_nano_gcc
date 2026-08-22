import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatInr } from "@/lib/pricing";
import { EmptyState, formatDate, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type Stats = {
  revenue_paise: number;
  active_members: number;
  enquiries_month: number;
  new_enquiries: number;
  stuck_orders: number;
  failed_orders: number;
  bounced_emails: number;
  unsent_receipts: number;
};

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  // One round trip. Each subquery is cheap and indexed, and a dashboard that
  // costs eight sequential HTTP queries against Neon feels sluggish for no
  // good reason.
  const rows = (await sql()`
    select
      coalesce((select sum(amount_paise) from orders where status = 'paid'), 0)::bigint as revenue_paise,
      (select count(*) from memberships where status = 'active')::int                   as active_members,
      (select count(*) from enquiries
        where created_at > date_trunc('month', now()))::int                             as enquiries_month,
      (select count(*) from enquiries where status = 'new')::int                        as new_enquiries,
      (select count(*) from orders
        where status in ('created', 'pending')
          and created_at < now() - interval '1 hour')::int                              as stuck_orders,
      (select count(*) from orders
        where status = 'failed' and created_at > now() - interval '30 days')::int       as failed_orders,
      (select count(*) from email_events
        where status in ('bounced', 'complained', 'failed')
          and created_at > now() - interval '30 days')::int                             as bounced_emails,
      (select count(*) from memberships m join orders o on o.id = m.order_id
        where m.welcome_email_sent_at is null and o.status = 'paid')::int               as unsent_receipts
  `) as Stats[];

  const s = rows[0]!;
  const revenue = Number(s.revenue_paise);
  const needsAttention = s.stuck_orders + s.bounced_emails + s.unsent_receipts;

  return (
    <>
      <h1 className="adm-h1">Dashboard</h1>
      <p className="adm-sub">
        Signed in as {admin.email}. Figures are live &mdash; revenue counts confirmed payments only.
      </p>

      <div className="adm-stats">
        <Stat k="Confirmed revenue" v={formatInr(revenue)} m="All paid orders, incl. GST" />
        <Stat k="Active memberships" v={String(s.active_members)} m="Currently valid" />
        <Stat k="Enquiries this month" v={String(s.enquiries_month)} m={`${s.new_enquiries} still untriaged`} />
        <Stat
          k="Needs attention"
          v={String(needsAttention)}
          m={
            needsAttention
              ? `${s.stuck_orders} unsettled, ${s.unsent_receipts} receipts unsent, ${s.bounced_emails} bounced`
              : "Nothing outstanding"
          }
          alert={needsAttention > 0}
        />
      </div>

      {/*
        The dashboard deliberately doesn't offer a "mark as paid" shortcut.
        Money state is only ever written by Razorpay's answer - the Payments
        page can re-ask the question, and that is the whole remedy.
      */}
      {needsAttention > 0 && (
        <div className="form-note" style={{ maxWidth: 720 }}>
          <strong>Some items need a look.</strong> Unsettled orders are re-checked against Razorpay
          automatically once a day, and unsent receipts are retried on the same schedule &mdash;
          most buyers are also covered sooner than that by the status page's own self-heal. If
          one persists, open{" "}
          <Link href="/admin/payments/" style={{ borderBottom: "1px solid currentColor" }}>
            Payments
          </Link>{" "}
          and re-check it directly.
        </div>
      )}

      <RecentActivity />
    </>
  );
}

async function RecentActivity() {
  const rows = (await sql()`
    select o.order_ref, o.email, o.organization, o.status, o.amount_paise, o.created_at,
           m.member_no
      from orders o
      left join memberships m on m.order_id = o.id
     order by o.created_at desc
     limit 8
  `) as {
    order_ref: string;
    email: string;
    organization: string | null;
    status: string;
    amount_paise: number;
    created_at: string;
    member_no: string | null;
  }[];

  if (!rows.length) return <EmptyState>No payment activity yet.</EmptyState>;

  return (
    <>
      <h2 className="adm-h1" style={{ fontSize: "1.1rem", marginTop: 8 }}>
        Latest payment activity
      </h2>
      <p className="adm-sub">The eight most recent orders.</p>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Institution</th>
              <th>Email</th>
              <th>Status</th>
              <th>Member no.</th>
              <th>Amount</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.order_ref}>
                <td className="mono">{row.order_ref}</td>
                <td className="wrap">{row.organization ?? "-"}</td>
                <td className="wrap">{row.email}</td>
                <td>
                  <StatusPill status={row.status} />
                </td>
                <td className="mono">{row.member_no ?? "-"}</td>
                <td className="mono">{formatInr(row.amount_paise)}</td>
                <td className="mono">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({ k, v, m, alert }: { k: string; v: string; m: string; alert?: boolean }) {
  return (
    <div className={alert ? "adm-stat alert" : "adm-stat"}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      <div className="m">{m}</div>
    </div>
  );
}
