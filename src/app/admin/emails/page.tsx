import { requireAdmin } from "@/lib/auth";
import { sql, type EmailEvent } from "@/lib/db";
import { EmptyState, formatDate, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * Outbound mail and its delivery state.
 *
 * Status is written by the Resend webhook, so a row stuck on `sent` means
 * Resend accepted it but hasn't reported delivery yet - not that anything is
 * wrong. `bounced` and `failed` are the ones worth acting on.
 */
export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status } = await searchParams;
  const filter = status ?? null;

  const rows = (await sql()`
    select * from email_events
     where (${filter}::text is null or status = ${filter})
     order by created_at desc
     limit 200
  `) as EmailEvent[];

  return (
    <>
      <h1 className="adm-h1">Emails</h1>
      <p className="adm-sub">
        Delivery tracking from the Resend webhook. Receipts that failed to send are retried
        automatically once a day, by the reconciliation cron.
      </p>

      <form className="adm-tools" method="get">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={filter ?? ""}>
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button className="adm-btn" type="submit">Apply</button>
        <a className="adm-btn ghost" href="/admin/emails/">Clear</a>
      </form>

      {rows.length === 0 ? (
        <EmptyState>No email activity yet.</EmptyState>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>To</th>
                <th>Template</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Last event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="mono">{formatDate(row.created_at)}</td>
                  <td className="wrap">{row.to_email}</td>
                  <td className="mono">{row.template}</td>
                  <td className="wrap">{row.subject ?? "-"}</td>
                  <td><StatusPill status={row.status} /></td>
                  <td className="mono">{formatDate(row.last_event_at)}</td>
                  <td className="wrap" style={{ color: "var(--ink-faint)" }}>{row.error ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
