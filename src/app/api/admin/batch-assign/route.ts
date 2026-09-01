import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: { studentId?: string; batchId?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request body." }, 400);
  }

  const { studentId, batchId } = body;

  if (!studentId || typeof studentId !== "string") {
    return json({ ok: false, error: "studentId is required." }, 400);
  }

  // batchId can be null (to remove from batch) or a UUID string (to assign)
  const newBatchId = batchId && typeof batchId === "string" && batchId.length > 0 ? batchId : null;

  try {
    await sql()`
      UPDATE students
      SET batch_id = ${newBatchId}, updated_at = now()
      WHERE id = ${studentId}
    `;

    return json({ ok: true });
  } catch (err: any) {
    console.error("batch-assign error:", err);
    return json({ ok: false, error: "Database error: " + err.message }, 500);
  }
}
