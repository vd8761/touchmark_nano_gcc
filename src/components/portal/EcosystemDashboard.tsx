import React from "react";
import Link from "next/link";
import ResetCompanyPasswordInline from "../admin/ResetCompanyPasswordInline";
import PortalPasswordChange from "./PortalPasswordChange";

export default function EcosystemDashboard({ partner, companies }: { partner: any, companies: any[] }) {
  if (!partner) {
    return <div className="adm-main"><div className="adm-err">Partner profile not found. Please contact administration.</div></div>;
  }

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="adm-h1" style={{ margin: 0 }}>{partner.name}</h1>
          <p className="adm-sub" style={{ margin: 0 }}>Ecosystem Partner Portal</p>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat">
          <div className="k">Total Companies</div>
          <div className="v">{companies.length}</div>
          <div className="m">Referred to Nano GCC</div>
        </div>
        <div className="adm-stat">
          <div className="k">Active Companies</div>
          <div className="v">{companies.filter(c => c.status === 'ACTIVE').length}</div>
          <div className="m">Successfully onboarded</div>
        </div>
        <div className="adm-stat">
          <div className="k">Commission Rate</div>
          <div className="v">
            {partner.commission_type === 'FIXED' ? '₹' : ''}
            {partner.commission_value}
            {partner.commission_type === 'PERCENTAGE' ? '%' : ''}
          </div>
          <div className="m">Per active placement</div>
        </div>
      </div>

      <div className="adm-card" style={{ background: "white", borderRadius: "8px", border: "1px solid var(--paper-2)", overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--paper-2)", background: "var(--paper-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Onboarded Companies</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Companies brought into the Nano GCC Hub under your partnership.</p>
          </div>
          <button className="adm-btn primary" style={{ fontSize: "0.9rem", padding: "6px 12px" }}>
            + Refer Company
          </button>
        </div>
        
        {companies.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)" }}>No companies onboarded yet</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Get started by referring your first company into the ecosystem.</p>
          </div>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Onboarding Date</th>
                  <th>Status</th>
                  <th>Password</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td><strong>{company.name}</strong></td>
                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold",
                        background: company.status === 'ACTIVE' ? "var(--success, #10b981)" : "var(--paper-3)",
                        color: company.status === 'ACTIVE' ? "white" : "var(--ink)"
                      }}>
                        {company.status?.replace(/_/g, ' ') || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <ResetCompanyPasswordInline 
                        companyId={company.id} 
                        initialTempPassword={company.contact_details?.tempPassword} 
                      />
                    </td>
                    <td style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                      {company.status === 'ACTIVE' ? 'Active Tracking' : 'Pending Activation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <PortalPasswordChange />
    </div>
  );
}
