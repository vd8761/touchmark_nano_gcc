import React from "react";
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  await requireAdmin();

  const students = await sql()`
    select s.*, c.name as company_name, col.name as college_name 
    from students s
    left join companies c on c.id = s.company_id
    left join colleges col on col.id = s.college_id
    order by s.created_at desc
  `;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 className="adm-h1">Student Records</h1>
          <p className="adm-sub" style={{ margin: 0 }}>Manage student placements and internships.</p>
        </div>
        <div className="acts">
          <Link href="/admin/students/new" className="act primary">
            + Add Student
          </Link>
        </div>
      </div>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name & Email</th>
              <th>Assigned Company</th>
              <th>Category</th>
              <th>Compensation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--ink-faint)" }}>
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td className="wrap">
                    <strong>{s.name}</strong>
                    <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{s.email}</div>
                  </td>
                  <td className="wrap">
                    {s.company_name || <span style={{ color: "var(--ink-faint)", fontStyle: "italic" }}>Unassigned</span>}
                  </td>
                  <td className="mono">{s.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}</td>
                  <td className="mono">
                    {s.category === 'INTERNSHIP' 
                      ? (s.stipend ? `₹${s.stipend}/mo` : 'Unpaid') 
                      : (s.lpa ? `₹${s.lpa} LPA` : 'N/A')}
                  </td>
                  <td>
                    <span style={{ 
                      padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold",
                      background: "var(--paper-3)", color: "var(--ink)"
                    }}>
                      {s.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
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
