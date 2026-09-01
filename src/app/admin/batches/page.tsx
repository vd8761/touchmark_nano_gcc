import React from "react";
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminBatchesPage() {
  await requireAdmin();

  const batches = await sql()`
    select 
      b.*, 
      c.name as company_name,
      col.name as college_name,
      (select count(*) from students s where s.batch_id = b.id) as student_count
    from internship_batches b
    join companies c on c.id = b.company_id
    left join colleges col on col.id = b.college_id
    order by b.created_at desc
  `;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingTop: "16px" }}>
        <div>
          <h1 className="adm-h1">Batches</h1>
          <p className="adm-sub">Manage internship and training batches across companies and institutions.</p>
        </div>
        <div className="acts">
          <Link href="/admin/batches/new" className="act primary">
            + Add Batch
          </Link>
        </div>
      </div>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>BATCH NAME</th>
              <th>COMPANY</th>
              <th>INSTITUTION</th>
              <th>DURATION</th>
              <th>STUDENTS</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>STATUS</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Created</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--ink-faint)" }}>
                  No batches found.
                </td>
              </tr>
            ) : (
              batches.map((b: any) => (
                <tr key={b.id}>
                  <td className="wrap">
                    <strong>{b.batch_name}</strong>
                  </td>
                  <td className="wrap">
                    {b.company_name}
                  </td>
                  <td className="wrap">
                    {b.college_name || <span style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Open Market</span>}
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                    {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{b.student_count}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: 
                        b.status === 'UPCOMING' ? '#FEF9C3' : 
                        b.status === 'ACTIVE' ? '#DBEAFE' : 
                        b.status === 'COMPLETED' ? '#DCFCE7' : '#FEE2E2',
                      color: 
                        b.status === 'UPCOMING' ? '#854D0E' : 
                        b.status === 'ACTIVE' ? '#1E40AF' : 
                        b.status === 'COMPLETED' ? '#166534' : '#991B1B',
                      border: `1px solid ${
                        b.status === 'UPCOMING' ? '#FEF08A' : 
                        b.status === 'ACTIVE' ? '#BFDBFE' : 
                        b.status === 'COMPLETED' ? '#BBF7D0' : '#FECACA'
                      }`
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {new Date(b.created_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <Link
                      href={`/admin/batches/${b.id}`}
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 6,
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        textDecoration: "none",
                      }}
                    >
                      View / Assign
                    </Link>
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
