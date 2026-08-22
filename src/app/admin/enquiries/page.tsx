import { requireAdmin } from "@/lib/auth";
import { sql, type Enquiry } from "@/lib/db";
import { EmptyState, formatDate } from "@/components/admin/ui";
import EnquiryFilters from "@/components/admin/EnquiryFilters";
import EnquiryRow from "@/components/admin/EnquiryRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const kind = params.kind === "institution" || params.kind === "organisation" ? params.kind : null;
  const status = params.status ?? null;
  const search = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  // Nulls stand in for "no filter", so one query covers every combination
  // instead of assembling SQL by string concatenation.
  const rows = (await sql()`
    select * from enquiries
     where (${kind}::text is null or kind = ${kind})
       and (${status}::text is null or status = ${status})
       and (${search || null}::text is null
            or lower(email) like '%' || lower(${search}) || '%'
            or lower(organization) like '%' || lower(${search}) || '%'
            or lower(name) like '%' || lower(${search}) || '%')
     order by created_at desc
     limit ${PAGE_SIZE + 1} offset ${(page - 1) * PAGE_SIZE}
  `) as Enquiry[];

  const hasMore = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);

  return (
    <>
      <h1 className="adm-h1">Enquiries</h1>
      <p className="adm-sub">
        Every submission from the contact form, both audiences. Status and notes are for your team
        only - they&rsquo;re never shown to the enquirer.
      </p>

      <EnquiryFilters kind={kind} status={status} search={search} />

      {visible.length === 0 ? (
        <EmptyState>No enquiries match those filters.</EmptyState>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Type</th>
                <th>Name</th>
                <th>Organisation</th>
                <th>Contact</th>
                <th>Interest</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <EnquiryRow key={row.id} enquiry={serialize(row)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} hasMore={hasMore} params={params} />
    </>
  );
}

/** Only what the row component needs - the rest (IP hash, UA) stays server-side. */
function serialize(row: Enquiry) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    email: row.email,
    organization: row.organization,
    phone: row.phone,
    role: row.role,
    city: row.city,
    teamSize: row.team_size,
    interest: row.interest,
    message: row.message,
    status: row.status,
    notes: row.admin_notes,
    createdAt: formatDate(row.created_at),
  };
}

function Pager({
  page,
  hasMore,
  params,
}: {
  page: number;
  hasMore: boolean;
  params: Record<string, string | undefined>;
}) {
  if (page === 1 && !hasMore) return null;

  const link = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    return `/admin/enquiries/${query.toString() ? `?${query}` : ""}`;
  };

  return (
    <div className="adm-tools" style={{ marginTop: 22, marginBottom: 0 }}>
      {page > 1 && (
        <a className="adm-btn ghost" href={link(page - 1)}>
          Previous
        </a>
      )}
      <span style={{ alignSelf: "center", fontSize: "0.82rem", color: "var(--ink-soft)" }}>
        Page {page}
      </span>
      {hasMore && (
        <a className="adm-btn ghost" href={link(page + 1)}>
          Next
        </a>
      )}
    </div>
  );
}
