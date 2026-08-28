"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  partnerId: string;
  email: string;
  initialTempPassword?: string;
}

export default function ResetPasswordWidget({ partnerId, email, initialTempPassword }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!confirm("Are you sure you want to generate a new password for this partner?")) return;
    
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/partners/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: partnerId }),
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
    <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "150px" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Login Credentials</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0, lineHeight: 1.4 }}>
            Share these credentials with the partner.
          </p>
        </div>
        <button 
          onClick={handleReset} 
          disabled={busy}
          className="adm-btn outline" 
          style={{ fontSize: "0.75rem", padding: "6px 12px", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {busy ? "Resetting..." : "Reset Password"}
        </button>
      </div>

      {error && <div className="adm-err" style={{ marginBottom: "12px", padding: "8px", fontSize: "0.85rem" }}>{error}</div>}

      <div style={{ background: "var(--paper-1)", padding: "16px", borderRadius: "6px", border: "1px solid var(--paper-2)", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Portal URL:</span>
          <span style={{ fontSize: "0.9rem" }}>/portal/login</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Login Email:</span>
          <span className="mono" style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>{email}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>Temporary Password:</span>
          <span className="mono" style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
            {initialTempPassword || "N/A (Reset Required)"}
          </span>
        </div>
      </div>
    </div>
  );
}
