import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <>
      <h1 className="adm-h1">Settings</h1>
      <p className="adm-sub">
        Mail routing for enquiry and payment notifications. Every field here overrides an
        environment variable &mdash; leave it blank to keep using the deployed default. Changes
        apply immediately, no redeploy needed.
      </p>

      <SettingsForm initial={settings} />
    </>
  );
}
