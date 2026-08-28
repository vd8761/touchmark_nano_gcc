import { requireAdmin } from "@/lib/auth";
import AgreementsEditor from "@/components/admin/AgreementsEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAgreementsPage() {
  await requireAdmin();

  return (
    <div className="panel">
      <div className="adm-header">
        <div>
          <div className="crumbs">
            <Link href="/admin">Admin</Link>
            <span className="sep">/</span>
            <Link href="/admin/settings">Settings</Link>
            <span className="sep">/</span>
            <span className="current">Legal Agreements</span>
          </div>
          <h1>Legal Agreements & MoUs</h1>
          <p className="measure" style={{ marginTop: 8, color: "var(--ink-soft)" }}>
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
