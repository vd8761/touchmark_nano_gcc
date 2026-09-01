import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import EditCompanyForm from "@/components/admin/EditCompanyForm";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const id = params.id;
  if (!id) notFound();

  const companies = await sql()`
    select c.*, u.email 
    from companies c
    join admin_users u on u.id = c.user_id
    where c.id = ${id}
  `;

  if (companies.length === 0) {
    notFound();
  }

  const company = companies[0];
  const partners = await sql()`select id, name from ecosystem_partners order by name asc`;

  return (
    <div className="adm-main">
      <EditCompanyForm 
        company={company} 
        partners={partners as {id: string, name: string}[]} 
      />
    </div>
  );
}
