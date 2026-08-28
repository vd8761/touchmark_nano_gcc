"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PortalPasswordChange() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = form.get("currentPassword") as string;
    const newPassword = form.get("newPassword") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/portal/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setError(data.error || "Failed to change password.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)", marginTop: "32px" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem" }}>Security Settings</h3>
      <p style={{ margin: "0 0 24px 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Change your portal access password.</p>
      
      {error && <div className="adm-err" style={{ marginBottom: "16px", padding: "12px" }}>{error}</div>}
      {success && <div style={{ background: "var(--primary-fade)", color: "var(--primary-dark)", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>Password changed successfully!</div>}
      
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px", maxWidth: "400px" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--ink-faint)" }}>CURRENT PASSWORD</label>
          <input type="password" name="currentPassword" required className="adm-input" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--paper-3)" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--ink-faint)" }}>NEW PASSWORD</label>
          <input type="password" name="newPassword" required className="adm-input" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--paper-3)" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px", color: "var(--ink-faint)" }}>CONFIRM NEW PASSWORD</label>
          <input type="password" name="confirmPassword" required className="adm-input" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--paper-3)" }} />
        </div>
        <div>
          <button type="submit" disabled={busy} className="adm-btn primary" style={{ padding: "10px 16px", width: "100%", marginTop: "8px" }}>
            {busy ? "Updating..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
