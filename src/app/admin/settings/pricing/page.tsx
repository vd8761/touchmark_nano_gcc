import { requireAdmin } from "@/lib/auth";

export default async function InstitutionPricingPage() {
  await requireAdmin();

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px 0" }}>Institution Pricing</h1>
        <p style={{ color: "var(--ink-soft)", margin: 0, fontSize: "0.9rem" }}>
          Configure membership fee tiers and pricing plans for institutional partners.
        </p>
      </div>

      <div style={{
        background: "var(--paper-1)",
        border: "1px solid var(--paper-3)",
        borderRadius: "12px",
        padding: "48px",
        textAlign: "center",
        color: "var(--ink-soft)"
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>💰</div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px", color: "var(--ink)" }}>
          Institution Pricing Settings
        </h2>
        <p style={{ fontSize: "0.875rem", maxWidth: "400px", margin: "0 auto" }}>
          Pricing configuration for institutional memberships will be available here.
          Contact the development team to activate this module.
        </p>
      </div>
    </div>
  );
}
