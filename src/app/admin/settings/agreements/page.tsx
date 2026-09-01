import { requireAdmin } from "@/lib/auth";
import AgreementsEditor from "@/components/admin/AgreementsEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAgreementsPage() {
  await requireAdmin();

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="adm-h1" style={{ marginTop: 8 }}>Legal Agreements & MoUs</h1>
          <p className="adm-sub">
            Edit the content of agreements presented to Ecosystem Partners, Companies, and Institutions for e-signature.
          </p>
        </div>
      </div>

      <div style={{ marginTop: "32px" }}>
        <AgreementsEditor />
      </div>
    </div>
  );
}
