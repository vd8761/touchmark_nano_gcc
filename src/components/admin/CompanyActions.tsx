"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyActions({ id, initialStatus }: { id: string, initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  const toggleStatus = async () => {
    if (busy) return;
    setBusy(true);
    const newStatus = status === "ACTIVE" ? "PENDING_NDA" : "ACTIVE";
    
    try {
      const res = await fetch("/api/admin/companies/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (res.ok) {
        setStatus(newStatus);
        router.refresh(); // Refresh server component data
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      alert("Error updating status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
        <input 
          type="checkbox" 
          checked={status === "ACTIVE"} 
          onChange={toggleStatus} 
          disabled={busy}
          style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
        />
        <div style={{
          width: "32px", height: "18px",
          backgroundColor: status === "ACTIVE" ? "var(--success, #10b981)" : "#e2e8f0",
          borderRadius: "18px",
          position: "relative",
          transition: "background-color 0.2s ease",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            width: "14px", height: "14px",
            backgroundColor: "white",
            borderRadius: "50%",
            position: "absolute",
            top: "2px",
            left: "2px",
            transform: status === "ACTIVE" ? "translateX(14px)" : "translateX(0)",
            transition: "transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
          }} />
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: status === "ACTIVE" ? "var(--success, #10b981)" : "var(--ink-soft)", minWidth: "85px" }}>
          {status === "ACTIVE" ? "Active" : "Pending NDA"}
        </span>
      </label>
    </div>
  );
}
