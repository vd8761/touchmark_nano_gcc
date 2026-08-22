import { requireAdmin } from "@/lib/auth";
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
        or a code default &mdash; leave it blank to keep using that default. Changes apply within
        a minute or so on the public site, and immediately for anything paid or emailed after that
        (no redeploy needed either way).
      </p>

      <SettingsForm
        initial={settings}
        defaultInstitutionAnnualAmountPaise={PLANS["institution-annual"].amountPaise}
      />
    </>
  );
}
