import React from "react";
import Link from "next/link";
import { formatDate, StatusPill } from "@/components/admin/ui";
import { Share2, Landmark, Building2, Globe } from "lucide-react";

export function DashboardPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: "20px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      padding: "24px"
    }}>
      <div style={{
        fontWeight: 700,
        fontSize: "1.05rem",
        color: "#1E293B",
        marginBottom: "16px"
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
  if (!items || items.length === 0) return <div style={{ color: "#94A3B8" }}>No recent members.</div>;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.slice(0, 5).map((item, i) => {
        let iconTheme = { color: '#8B5CF6', bg: '#F5F3FF', icon: <Share2 size={16} strokeWidth={2.5} /> }; // Partner
        if (item.type === 'College') iconTheme = { color: '#3B82F6', bg: '#EFF6FF', icon: <Landmark size={16} strokeWidth={2.5} /> };
        if (item.type === 'Corporate') iconTheme = { color: '#F59E0B', bg: '#FFFBEB', icon: <Building2 size={16} strokeWidth={2.5} /> };

        return (
          <li key={i} style={{ 
            padding: "16px 0", 
            borderBottom: i < Math.min(items.length, 5) - 1 ? "1px solid #F1F5F9" : "none",
            display: "flex",
            gap: "14px",
            alignItems: "center"
          }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
              background: iconTheme.bg, color: iconTheme.color,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {iconTheme.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.type} • {formatDate(item.created_at)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CountryDistributionList({ items }: { items: any[] }) {
  if (!items || items.length === 0) return <div style={{ color: "#94A3B8" }}>No data available.</div>;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {items.slice(0, 5).map((item, i) => (
        <li key={i} style={{ 
          padding: "12px 16px", 
          marginBottom: "8px",
          background: "#F8FAFC",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ 
              width: "32px", height: "32px", borderRadius: "8px", 
              background: "#F0F9FF", color: "#0284C7", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Globe size={16} strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 600, color: "#334155" }}>{item.country || "Unknown"}</span>
          </div>
          <div style={{ 
            background: "#F1F5F9", 
            color: "#475569",
            fontWeight: 700, 
            fontSize: "0.85rem",
            padding: "4px 10px", 
            borderRadius: "99px" 
          }}>
            {item.count}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StudentPlacementFeed({ students }: { students: any[] }) {
  if (!students || students.length === 0) return <div style={{ color: "#94A3B8" }}>No placement data.</div>;

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {students.slice(0, 5).map((item, i) => (
        <li key={i} style={{ 
          padding: "16px 0", 
          borderBottom: i < Math.min(students.length, 5) - 1 ? "1px solid #F1F5F9" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
            <strong style={{ fontSize: "0.95rem", color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</strong>
            <div style={{ flexShrink: 0, marginLeft: "8px" }}><StatusPill status={item.status} /></div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={14} color="#F59E0B" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.company_name || 'Unassigned'}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <Landmark size={14} color="#3B82F6" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.college_name || 'Unassigned'}</span>
              </div>
              <span style={{ 
                background: "#F8FAFC", color: "#475569", 
                padding: "2px 8px", borderRadius: "4px", 
                fontSize: "0.75rem", fontWeight: 600, flexShrink: 0
              }}>
                {item.category === 'INTERNSHIP' ? 'Internship' : 'Offer'}
              </span>
            </div>
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
          box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important;
        }
      `}</style>
      <div style={{
        display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "24px"
    }}>
      {companies.map((item, i) => {
        const details = item.contact_details || {};
        return (
          <Link href={`/admin/companies/${item.id}`} key={i} className="corp-card" style={{ 
            background: "#FFFFFF",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid #F1F5F9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            color: "inherit",
            textDecoration: "none"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ 
                width: "44px", height: "44px", 
                borderRadius: "12px", 
                background: "#FFFBEB",
                color: "#F59E0B",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>{item.name}</h3>
                <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>{details.country || "Unknown Location"}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Sector</div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#334155" }}>{details.industrySector || 'N/A'}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Size</div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#334155" }}>{details.companySize || 'N/A'}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Est. Turnover</div>
                <div style={{ 
                  background: "#F0FDF4", 
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                  padding: "4px 10px",
                  borderRadius: "99px",
                  fontWeight: 700, 
                  fontSize: "0.8rem",
                }}>
                  {details.companyTurnover || 'Undisclosed'}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
    </>
  );
}
