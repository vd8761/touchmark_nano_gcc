import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body: { id: string; status: string };
  try {
    body = (await req.json()) as { id: string; status: string };
  } catch {
    return badRequest("Malformed request.");
  }

  const { id, status } = body;
  
  if (!id || !status) {
    return badRequest("Missing id or status.");
  }

  try {
    await sql()`
      update ecosystem_partners
      set nda_status = ${status}
      where id = ${id}
    `;
    return json({ ok: true });
  } catch (err) {
    console.error("Failed to update status:", err);
    return json({ ok: false, error: "Failed to update status" }, 500);
  }
}
