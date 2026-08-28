import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { hashPassword } from "@/lib/crypto";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body: { id: string };
  try {
    body = (await req.json()) as { id: string };
  } catch {
    return badRequest("Malformed request.");
  }

  const { id } = body;
  if (!id) return badRequest("Missing id.");

  try {
    const partners = await sql()`select user_id, contact_details from ecosystem_partners where id = ${id}`;
    if (partners.length === 0) return badRequest("Partner not found.");

    const partner = partners[0];
    const userId = partner.user_id;

    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);

    await sql()`
      update admin_users
      set password_hash = ${tempPasswordHash}
      where id = ${userId}
    `;

    const contactDetails = partner.contact_details || {};
    contactDetails.tempPassword = tempPassword;

    await sql()`
      update ecosystem_partners
      set contact_details = ${JSON.stringify(contactDetails)}::jsonb
      where id = ${id}
    `;

    return json({ ok: true });
  } catch (err) {
    console.error("Failed to reset password:", err);
    return json({ ok: false, error: "Internal server error" }, 500);
  }
}
