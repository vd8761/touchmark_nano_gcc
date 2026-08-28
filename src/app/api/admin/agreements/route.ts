import { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");
  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") return json({ error: "Unauthorized" }, 401);

  try {
    const docs = await sql()`select * from legal_documents order by title asc`;
    return json({ docs });
  } catch (error) {
    console.error("Failed to fetch agreements:", error);
    return json({ error: "Server error" }, 500);
  }
}

export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");
  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") return json({ error: "Unauthorized" }, 401);

  let body: { document_key: string; content_html: string };
  try {
    body = (await req.json()) as { document_key: string; content_html: string };
  } catch {
    return badRequest("Malformed JSON");
  }

  if (!body.document_key || !body.content_html) {
    return badRequest("Missing key or content");
  }

  try {
    await sql()`
      update legal_documents 
      set content_html = ${body.content_html}, updated_at = now()
      where document_key = ${body.document_key}
    `;
    return json({ ok: true });
  } catch (error) {
    console.error("Failed to update agreement:", error);
    return json({ error: "Server error" }, 500);
  }
}
