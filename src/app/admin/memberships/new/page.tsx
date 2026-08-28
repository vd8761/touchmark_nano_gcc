import { requireAdmin } from "@/lib/auth";
import NewInstitutionForm from "@/components/admin/NewInstitutionForm";

export const dynamic = "force-dynamic";

export default async function NewInstitutionPage() {
  await requireAdmin();

  return (
    <div className="adm-main">
      <NewInstitutionForm />
    </div>
  );
}
