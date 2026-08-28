import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewStudentForm from "@/components/admin/NewStudentForm";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  await requireAdmin();
  const companies = await sql()`select id, name from companies order by name asc`;

  return (
    <div className="adm-main">
      <NewStudentForm companies={companies as {id: string, name: string}[]} />
    </div>
  );
}
