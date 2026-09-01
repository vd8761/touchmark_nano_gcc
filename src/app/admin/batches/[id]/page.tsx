import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import BatchAssignStudents from "@/components/admin/BatchAssignStudents";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [batches, studentsInBatch, unassignedStudents] = await Promise.all([
    sql()`
      SELECT b.*, c.name AS company_name, col.name AS college_name
      FROM internship_batches b
      JOIN companies c ON c.id = b.company_id
      LEFT JOIN colleges col ON col.id = b.college_id
      WHERE b.id = ${id}
      LIMIT 1
    `,
    sql()`
      SELECT s.id, s.name, s.email, s.status, s.category
      FROM students s
      WHERE s.batch_id = ${id}
      ORDER BY s.name ASC
    `,
    sql()`
      SELECT s.id, s.name, s.email, s.category
      FROM students s
      WHERE s.batch_id IS NULL
      ORDER BY s.name ASC
    `,
  ]);

  const batch = batches[0] as any;
  if (!batch) return notFound();

  return (
    <div className="adm-main">
      {/* Header — matches standard admin page layout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingTop: 16, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/batches" style={{ color: "var(--ink-soft)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Back to Batches
          </Link>
          <h1 className="adm-h1" style={{ marginTop: 6, marginBottom: 4 }}>{batch.batch_name}</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>
            {batch.company_name}
            {batch.college_name ? ` · ${batch.college_name}` : " · Open Market"}
            {" · "}
            {new Date(batch.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            {" – "}
            {new Date(batch.end_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="acts">
          <span style={{
            padding: "5px 12px",
            borderRadius: 6,
            fontSize: "0.78rem",
            fontWeight: 700,
            backgroundColor: batch.status === "UPCOMING" ? "#FEF9C3" : batch.status === "ACTIVE" ? "#DBEAFE" : batch.status === "COMPLETED" ? "#DCFCE7" : "#FEE2E2",
            color: batch.status === "UPCOMING" ? "#854D0E" : batch.status === "ACTIVE" ? "#1E40AF" : batch.status === "COMPLETED" ? "#166534" : "#991B1B",
          }}>
            {batch.status}
          </span>
          <Link href={`/admin/students/new?batchId=${id}`} className="act primary">
            + Add New Student
          </Link>
        </div>
      </div>

      {/* Students Currently In This Batch */}
      <div className="adm-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="adm-h1" style={{ fontSize: "1.05rem", margin: 0 }}>
            Students in this Batch
            <span style={{ marginLeft: 8, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 12, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 700 }}>
              {(studentsInBatch as any[]).length}
            </span>
          </h2>
        </div>

        {(studentsInBatch as any[]).length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", padding: "12px 0" }}>
            No students assigned to this batch yet.
          </p>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(studentsInBatch as any[]).map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="mono" style={{ fontSize: "0.85rem" }}>{s.email}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600,
                        background: s.category === "INTERNSHIP" ? "#EFF6FF" : "#F0FDF4",
                        color: s.category === "INTERNSHIP" ? "#1D4ED8" : "#166534",
                      }}>
                        {s.category}
                      </span>
                    </td>
                    <td>{s.status}</td>
                    <td>
                      <BatchAssignStudents batchId={id} studentId={s.id} action="remove" label="Remove" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Existing Students */}
      <div className="adm-card">
        <h2 className="adm-h1" style={{ fontSize: "1.05rem", marginBottom: 16 }}>
          Assign Existing Students to this Batch
          <span style={{ marginLeft: 8, background: "#F1F5F9", color: "#64748B", borderRadius: 12, padding: "2px 10px", fontSize: "0.8rem", fontWeight: 600 }}>
            {(unassignedStudents as any[]).length} unassigned
          </span>
        </h2>

        {(unassignedStudents as any[]).length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
            All students are already assigned to a batch. <Link href="/admin/students/new" style={{ color: "var(--primary)" }}>Add a new student</Link>.
          </p>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>CATEGORY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(unassignedStudents as any[]).map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="mono" style={{ fontSize: "0.85rem" }}>{s.email}</td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600,
                        background: s.category === "INTERNSHIP" ? "#EFF6FF" : "#F0FDF4",
                        color: s.category === "INTERNSHIP" ? "#1D4ED8" : "#166534",
                      }}>
                        {s.category}
                      </span>
                    </td>
                    <td>
                      <BatchAssignStudents batchId={id} studentId={s.id} action="assign" label="Assign to Batch" />
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
