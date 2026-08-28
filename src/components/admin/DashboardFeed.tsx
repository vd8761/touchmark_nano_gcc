import React from "react";
import Link from "next/link";
import { formatDate, StatusPill } from "@/components/admin/ui";

export function DashboardPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid var(--paper-3)",
      borderRadius: "12px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--paper-3)",
        background: "var(--paper-1)",
        fontWeight: 600,
        fontSize: "1.05rem"
      }}>
        {title}
      </div>
      <div style={{ padding: "0", flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

export function NetworkMemberFeed({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-soft)" }}>No recent members found.</div>;
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ 
          padding: "16px 20px", 
          borderBottom: i < items.length - 1 ? "1px solid var(--paper-2)" : "none",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start"
        }}>
          <div style={{ fontSize: "1.2rem", marginTop: "2px" }}>
            {item.type === 'College' ? '🏫' : item.type === 'Corporate' ? '🏢' : '🤝'}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{item.name}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "4px" }}>
              Joined {formatDate(item.created_at)} • {item.type}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CountryDistributionList({ items }: { items: { country: string, count: number }[] }) {
  if (!items || items.length === 0) {
    return <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-soft)" }}>No geographic data available.</div>;
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ 
          padding: "16px 20px", 
          borderBottom: i < items.length - 1 ? "1px solid var(--paper-2)" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>🌍</span>
            <span style={{ fontWeight: 500 }}>{item.country || "Unknown"}</span>
          </div>
          <div style={{ 
            background: "var(--paper-2)", 
            padding: "4px 12px", 
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: 600
          }}>
            {item.count}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StudentPlacementFeed({ students }: { students: any[] }) {
  if (!students || students.length === 0) {
    return <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-soft)" }}>No recent placements.</div>;
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {students.map((item, i) => (
        <li key={i} style={{ 
          padding: "16px 20px", 
          borderBottom: i < students.length - 1 ? "1px solid var(--paper-2)" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <strong style={{ fontSize: "0.95rem" }}>{item.name}</strong>
            <StatusPill status={item.status} />
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span>🏢 {item.company_name || 'Unassigned'}</span>
            <span>🏫 {item.college_name || 'Unassigned'}</span>
            <span style={{ 
              display: "inline-block", 
              background: "var(--paper-2)", 
              padding: "2px 8px", 
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              width: "fit-content",
              marginTop: "4px"
            }}>
              {item.category === 'INTERNSHIP' ? 'Internship' : 'Offer'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CorporateProfileFeed({ companies }: { companies: any[] }) {
  if (!companies || companies.length === 0) {
    return <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-soft)" }}>No corporate profile data available.</div>;
  }

  return (
    <>
      <style>{`
        .corp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important;
        }
      `}</style>
      <div style={{
        display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
      padding: "20px 0"
    }}>
      {companies.map((item, i) => {
        const details = item.contact_details || {};
        return (
          <div key={i} className="corp-card" style={{ 
            background: "var(--paper)",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid var(--paper-2)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            cursor: "default"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "48px", height: "48px", 
                  borderRadius: "12px", 
                  background: "linear-gradient(135deg, var(--paper-2) 0%, var(--paper-1) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                  border: "1px solid var(--paper-3)"
                }}>🏢</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>{item.name}</h3>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>{details.country || "Unknown Location"}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--paper-1)", borderRadius: "10px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ink-faint)", marginBottom: "4px" }}>Sector</div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{details.industrySector || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ink-faint)", marginBottom: "4px" }}>Company Size</div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{details.companySize || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: "1 / -1", marginTop: "4px" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ink-faint)", marginBottom: "8px" }}>Est. Turnover</div>
                <div style={{ 
                  display: "inline-block",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontWeight: 700, 
                  fontSize: "1.1rem",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                }}>
                  {details.companyTurnover || 'Undisclosed'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
