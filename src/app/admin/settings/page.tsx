import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { PLANS } from "@/lib/pricing";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <>
      <h1 className="adm-h1">Settings</h1>
      <p className="adm-sub">
        Mail routing and the membership price. Every field here overrides an environment variable
        or a code default - leave it blank to keep using that default. Changes apply within
        a minute or so on the public site, and immediately for anything paid or emailed after that
        (no redeploy needed either way).
      </p>

      <div style={{ margin: "24px 0", padding: "16px", background: "var(--card-bg, #fff)", border: "1px solid var(--rule)", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Legal Agreements & MoUs</h2>
        <p style={{ color: "var(--ink-soft)", marginBottom: "16px", fontSize: "0.95rem" }}>
          Configure the templates used for Ecosystem Partner, Corporate, and Institution Agreements.
        </p>
        <Link href="/admin/settings/agreements" className="adm-btn ghost" style={{ textDecoration: "none" }}>
          Open Agreements Editor &rarr;
        </Link>
      </div>

      <SettingsForm
        initial={settings}
        defaultInstitutionAnnualAmountPaise={PLANS["institution-annual"].amountPaise}
        defaultPriceIncludesGst={PLANS["institution-annual"].priceIncludesGst}
        gstRate={PLANS["institution-annual"].gstRate}
      />
    </>
  );
}
