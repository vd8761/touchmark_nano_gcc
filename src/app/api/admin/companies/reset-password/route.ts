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
  if (!admin) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  // Allow ADMIN or ECOSYSTEM_PARTNER
  if (admin.role !== "ADMIN" && admin.role !== "ECOSYSTEM_PARTNER") {
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
    const companies = await sql()`select user_id, contact_details, ecosystem_partner_id from companies where id = ${id}`;
    if (companies.length === 0) return badRequest("Company not found.");

    const company = companies[0];

    // Check authorization: if user is ECOSYSTEM_PARTNER, make sure this company belongs to them
    if (admin.role === "ECOSYSTEM_PARTNER") {
      const partners = await sql()`select id from ecosystem_partners where user_id = ${admin.id}`;
      if (partners.length === 0 || partners[0].id !== company.ecosystem_partner_id) {
        return json({ ok: false, error: "Unauthorized to reset this company's password." }, 403);
      }
    }

    const userId = company.user_id;

    const tempPassword = randomBytes(4).toString("hex");
    const tempPasswordHash = hashPassword(tempPassword);

    await sql()`
      update admin_users
      set password_hash = ${tempPasswordHash}
      where id = ${userId}
    `;

    const contactDetails = company.contact_details || {};
    contactDetails.tempPassword = tempPassword;

    await sql()`
      update companies
      set contact_details = ${JSON.stringify(contactDetails)}::jsonb
      where id = ${id}
    `;

    return json({ ok: true, tempPassword });
  } catch (error) {
    console.error("Failed to reset company password", error);
    return json({ ok: false, error: "Server error." }, 500);
  }
}
