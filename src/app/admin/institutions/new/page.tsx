import React from "react";
import NewInstitutionForm from "@/components/admin/NewInstitutionForm";

export const dynamic = "force-dynamic";

export default function AdminNewInstitutionPage() {
  return (
    <div className="adm-main">
      <NewInstitutionForm />
    </div>
  );
}
