import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import EditMembershipForm from "@/components/admin/EditMembershipForm";

export const dynamic = "force-dynamic";

export default async function AdminEditMembershipPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const id = params.id;
  if (!id) notFound();

  const results = await sql()`
    select * from memberships
    where member_no = ${id} or id::text = ${id}
  `;

  if (!results || results.length === 0) {
    notFound();
  }

  const membership = results[0];

  return (
    <div className="adm-main">
      <EditMembershipForm membership={membership} />
    </div>
  );
}
