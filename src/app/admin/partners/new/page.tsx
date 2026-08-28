import { requireAdmin } from "@/lib/auth";
import NewPartnerForm from "@/components/admin/NewPartnerForm";

export const dynamic = "force-dynamic";

export default async function NewPartnerPage() {
  await requireAdmin();

  return (
    <div className="adm-main">
      <NewPartnerForm />
    </div>
  );
}
