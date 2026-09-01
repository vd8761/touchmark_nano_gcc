import React from "react";
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  await requireAdmin();

  const institutions = await sql()`
    select c.*, u.email 
    from colleges c
    join admin_users u on u.id = c.user_id
    order by c.created_at desc
  `;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="adm-h1">Institutions</h1>
          <p className="adm-sub">Manage academic institutions participating in the ecosystem.</p>
        </div>
        <div className="acts">
          <Link href="/admin/institutions/new" className="act primary">
            + Add Institution
          </Link>
        </div>
      </div>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>INSTITUTION NAME</th>
              <th>MEMBERSHIP PLAN</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>STATUS</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {institutions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--ink-faint)" }}>
                  No institutions found.
                </td>
              </tr>
            ) : (
              institutions.map((inst: any) => (
                <tr key={inst.id}>
                  <td className="wrap">
                    <Link href={`/admin/institutions/${inst.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <strong style={{ color: "var(--brand-primary)" }}>{inst.name}</strong>
                    </Link>
                    <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{inst.email}</div>
                  </td>
                  <td className="wrap">
                    {inst.membership_plan || 'N/A'}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: inst.status === 'ACTIVE' ? '#F0FDF4' : '#FEF2F2',
                      color: inst.status === 'ACTIVE' ? '#166534' : '#991B1B',
                      border: `1px solid ${inst.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2'}`
                    }}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {new Date(inst.created_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
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
