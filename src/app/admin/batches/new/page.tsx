import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import NewBatchForm from "@/components/admin/NewBatchForm";

export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  await requireAdmin();
  
  const companies = await sql()`select id, name from companies order by name asc`;
  const colleges = await sql()`select id, name from colleges order by name asc`;

  return (
    <div className="adm-main">
      <NewBatchForm 
        companies={companies as {id: string, name: string}[]} 
        colleges={colleges as {id: string, name: string}[]} 
      />
    </div>
  );
}
