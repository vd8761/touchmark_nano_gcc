import React from "react";
import { sql } from "@/lib/db";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import PartnerActions from "@/components/admin/PartnerActions";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  await requireAdmin();
  
  const partners = await sql()`
    select ep.*, u.email, u.name as contact_person
    from ecosystem_partners ep
    join admin_users u on u.id = ep.user_id
    order by ep.created_at desc
  `;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 className="adm-h1">Ecosystem Partners</h1>
          <p className="adm-sub" style={{ margin: 0 }}>View registered ecosystem partners and their network status.</p>
        </div>
        <div className="acts">
          <Link href="/admin/partners/new" className="act primary">
            + Add Partner
          </Link>
        </div>
      </div>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Contact & Email</th>
              <th>Status</th>
              <th>Commission</th>
              <th>Created</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--ink-faint)" }}>
                  No partners found.
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id}>
                  <td className="wrap">
                    <strong>{p.name}</strong>
                    {p.contact_details?.location && <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{p.contact_details.location}, {p.contact_details.country}</div>}
                  </td>
                  <td className="wrap">
                    <div style={{ fontWeight: 500 }}>{p.contact_person}</div>
                    <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{p.email}</div>
                    {p.contact_details?.phone && <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{p.contact_details.phone}</div>}
                  </td>
                  <td>
                    <span className="pill" style={{ 
                      background: p.nda_status === 'ACTIVE' ? "var(--success, #10b981)" : p.nda_status === 'NDA_SIGNED' ? "#0284c7" : "var(--paper-3)",
                      color: p.nda_status === 'ACTIVE' || p.nda_status === 'NDA_SIGNED' ? "white" : "var(--ink)",
                      borderColor: "transparent"
                    }}>
                      {p.nda_status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="mono">
                    {p.commission_type === 'FIXED' ? '₹' : ''}{parseFloat(p.commission_value)}{p.commission_type === 'PERCENTAGE' ? '%' : ''}
                  </td>
                  <td className="mono">
                    {new Date(p.created_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <PartnerActions id={p.id} initialStatus={p.nda_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
