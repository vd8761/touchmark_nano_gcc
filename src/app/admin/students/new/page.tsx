import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewStudentForm from "@/components/admin/NewStudentForm";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  await requireAdmin();
  const companies = await sql()`select id, name from companies order by name asc`;
  const batches = await sql()`
    select b.id, b.batch_name, c.name as company_name
    from internship_batches b
    join companies c on c.id = b.company_id
    where b.status in ('UPCOMING', 'ACTIVE')
    order by b.batch_name asc
  `;

  return (
    <div className="adm-main">
      <NewStudentForm
        companies={companies as { id: string; name: string }[]}
        batches={batches as { id: string; batch_name: string; company_name: string }[]}
      />
    </div>
  );
}
