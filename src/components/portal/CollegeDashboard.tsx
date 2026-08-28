import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import RenewMembershipWidget from "./RenewMembershipWidget";

export default function CollegeDashboard({ membership, subscriptions = [] }: { membership: any, subscriptions?: any[] }) {
  if (!membership) {
    return <div className="adm-main"><div className="adm-err">Institution profile not found. Please contact administration.</div></div>;
  }

  const validUntil = new Date(membership.valid_until);
  const now = new Date();
  const isExpired = validUntil < now;
  const daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const canRenew = isExpired || daysRemaining <= 30;

  const profile = membership.profile_data || {};
  
  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="adm-h1" style={{ margin: 0 }}>{membership.institution}</h1>
          <p className="adm-sub" style={{ margin: 0 }}>Institution Portal (ID: {membership.member_no})</p>
        </div>
      </div>

      {canRenew && (
        <RenewMembershipWidget 
          isExpired={isExpired} 
          daysRemaining={daysRemaining} 
          validUntil={validUntil} 
        />
      )}

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: "24px", 
        marginBottom: "32px" 
      }}>
        <div style={{ 
          background: "rgba(255, 255, 255, 0.7)", 
          backdropFilter: "blur(12px)", 
          border: "1px solid var(--paper-2)", 
          borderRadius: "12px", 
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Membership Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ 
              width: "12px", height: "12px", borderRadius: "50%", 
              background: !isExpired ? "var(--success)" : "var(--critical)",
              boxShadow: `0 0 0 4px ${!isExpired ? "rgba(16, 185, 129, 0.2)" : "rgba(220, 38, 38, 0.2)"}`
            }}></div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)" }}>
              {!isExpired ? 'Active' : 'Expired'}
            </div>
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--ink-faint)" }}>
            Valid until <strong style={{ color: "var(--ink)" }}>{format(validUntil, 'dd MMM yyyy')}</strong>
          </div>
        </div>

        <div style={{ 
          background: "rgba(255, 255, 255, 0.7)", 
          backdropFilter: "blur(12px)", 
          border: "1px solid var(--paper-2)", 
          borderRadius: "12px", 
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Primary Contact</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--ink)", marginBottom: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {membership.name}
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {membership.email}
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ background: "white", borderRadius: "8px", border: "1px solid var(--paper-2)", overflow: "hidden", padding: 0, marginBottom: "24px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--paper-2)", background: "var(--paper-1)" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Institution Details</h3>
        </div>
        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "4px" }}>Location</div>
              <div style={{ fontWeight: 500 }}>{profile.location || "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "4px" }}>Country</div>
              <div style={{ fontWeight: 500 }}>{profile.country || "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "4px" }}>Institution Type</div>
              <div style={{ fontWeight: 500 }}>{profile.institutionType || "N/A"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "4px" }}>Faculty Coordinator</div>
              <div style={{ fontWeight: 500 }}>{profile.facultyCoordinatorName || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ background: "white", borderRadius: "8px", border: "1px solid var(--paper-2)", overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--paper-2)", background: "var(--paper-1)" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Subscription History</h3>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Order Ref</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "var(--ink-soft)" }}>
                    No subscription history available yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map(s => (
                  <tr key={s.id}>
                    <td>{format(new Date(s.valid_from), 'dd MMM yyyy')}</td>
                    <td>{format(new Date(s.valid_until), 'dd MMM yyyy')}</td>
                    <td style={{ fontFamily: "monospace" }}>{s.order_id || 'Manual Entry'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
