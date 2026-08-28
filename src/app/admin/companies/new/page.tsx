import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewCompanyForm from "@/components/admin/NewCompanyForm";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  await requireAdmin();
  const partners = await sql()`select id, name from ecosystem_partners order by name asc`;

  return (
    <div className="adm-main">
      <NewCompanyForm partners={partners as {id: string, name: string}[]} />
    </div>
  );
}
