"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  companyId: string;
  initialTempPassword?: string;
}

export default function ResetCompanyPasswordInline({ companyId, initialTempPassword }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!confirm("Are you sure you want to generate a new password for this company?")) return;
    
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/companies/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: companyId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        router.refresh(); // Refresh server component to get new password
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {initialTempPassword ? (
        <code style={{ background: "var(--paper-2)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.85rem" }}>
          {initialTempPassword}
        </code>
      ) : (
        <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>Not Set</span>
      )}
      
      <button 
        onClick={handleReset} 
        disabled={busy}
        style={{
          background: "transparent", border: "1px solid var(--paper-2)", 
          borderRadius: "4px", padding: "2px 8px", fontSize: "0.8rem",
          cursor: busy ? "not-allowed" : "pointer",
          color: "var(--ink)"
        }}
      >
        {busy ? "..." : initialTempPassword ? "Reset" : "Generate"}
      </button>

      {error && <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{error}</span>}
    </div>
  );
}
