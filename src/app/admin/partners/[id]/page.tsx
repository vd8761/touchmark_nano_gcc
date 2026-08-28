import React from "react";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ResetPasswordWidget from "@/components/admin/ResetPasswordWidget";
import DocumentTracker from "@/components/admin/DocumentTracker";

export const dynamic = "force-dynamic";

export default async function PartnerViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const records = await sql()`
    select ep.*, u.email, u.name as contact_person
    from ecosystem_partners ep
    join admin_users u on u.id = ep.user_id
    where ep.id = ${id}
  `;
  
  if (records.length === 0) {
    notFound();
  }
  const p = records[0];

  const companies = await sql()`select count(*) as count from companies where ecosystem_partner_id = ${id}`;
  const companyCount = companies[0]?.count || 0;

  const students = await sql()`
    select count(*) as count from students s
    join companies c on c.id = s.company_id
    where c.ecosystem_partner_id = ${id}
  `;
  const studentCount = students[0]?.count || 0;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="adm-h1" style={{ display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
            {p.name}
            <span style={{ 
              padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold",
              background: p.nda_status === 'ACTIVE' ? "var(--success, #10b981)" : p.nda_status === 'NDA_SIGNED' ? "#0284c7" : "var(--paper-3)",
              color: p.nda_status === 'ACTIVE' || p.nda_status === 'NDA_SIGNED' ? "white" : "var(--ink)"
            }}>
              {p.nda_status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
            </span>
          </h1>
        </div>
        <Link href="/admin/partners" className="adm-btn ghost" style={{ textDecoration: "none", marginTop: "8px" }}>
          &larr; Back to Partners
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Contact Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-faint)", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>Contact Person</label>
                <div>{p.contact_person}</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-faint)", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>Email</label>
                <div>{p.email}</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-faint)", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>Phone Number</label>
                <div>{p.contact_details?.phone || "N/A"}</div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-faint)", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>Location</label>
                <div>{p.contact_details?.location || "N/A"}, {p.contact_details?.country || "N/A"}</div>
              </div>
            </div>
          </div>

          <DocumentTracker 
            partnerId={p.id} 
            ndaStatus={p.nda_status} 
            documentUrl={p.contact_details?.nda_document_url} 
            mouStatus={p.mou_status}
            mouUrl={p.contact_details?.mou_document_url}
            commissionStatus={p.commission_status}
            commissionUrl={p.contact_details?.commission_document_url}
          />

        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="adm-card" style={{ background: "white", padding: "24px", borderRadius: "8px", border: "1px solid var(--paper-2)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Network Statistics</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--paper-1)" }}>
              <span style={{ color: "var(--ink-soft)" }}>Linked Companies</span>
              <strong style={{ fontSize: "1.2rem" }}>{companyCount}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--ink-soft)" }}>Total Placements</span>
              <strong style={{ fontSize: "1.2rem" }}>{studentCount}</strong>
            </div>
          </div>

          <ResetPasswordWidget 
            partnerId={p.id} 
            email={p.email} 
            initialTempPassword={p.contact_details?.tempPassword} 
          />

        </div>
      </div>
    </div>
  );
}
