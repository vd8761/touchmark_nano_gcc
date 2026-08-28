import React from "react";
import Link from "next/link";

export default function CompanyDashboard({ company, students }: { company: any, students: any[] }) {
  if (!company) {
    return <div className="adm-main"><div className="adm-err">Company profile not found. Please contact administration.</div></div>;
  }

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="adm-h1" style={{ margin: 0 }}>{company.name}</h1>
          <p className="adm-sub" style={{ margin: 0 }}>Company Portal</p>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat">
          <div className="k">Total Students</div>
          <div className="v">{students.length}</div>
          <div className="m">Assigned to your company</div>
        </div>
        <div className="adm-stat">
          <div className="k">Active Students</div>
          <div className="v">{students.filter(s => s.status === 'ACTIVE').length}</div>
          <div className="m">Currently in training</div>
        </div>
      </div>

      <div className="adm-card" style={{ background: "white", borderRadius: "8px", border: "1px solid var(--paper-2)", overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--paper-2)", background: "var(--paper-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Enrolled Students</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Students currently undergoing training for your company.</p>
          </div>
        </div>
        
        {students.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--ink)" }}>No students assigned</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>Students will appear here once they are assigned to your company.</p>
          </div>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.name}</strong></td>
                    <td>{new Date(student.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold",
                        background: student.status === 'ACTIVE' ? "var(--success, #10b981)" : "var(--paper-3)",
                        color: student.status === 'ACTIVE' ? "white" : "var(--ink)"
                      }}>
                        {student.status?.replace(/_/g, ' ') || 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                      In Progress
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
