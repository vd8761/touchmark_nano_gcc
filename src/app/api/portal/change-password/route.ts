import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { badRequest, json, sameOrigin } from "@/lib/request";
import { hashPassword } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  const admin = await currentAdmin();
  if (!admin) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest("Malformed request.");
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) return badRequest("Missing fields.");

  try {
    // 1. Verify current password
    const currentHash = hashPassword(currentPassword);
    const users = await sql`select * from admin_users where id = ${admin.id} and password_hash = ${currentHash}`;
    
    if (users.length === 0) {
      return json({ ok: false, error: "Incorrect current password." }, 400);
    }

    // 2. Hash new password and update
    const newHash = hashPassword(newPassword);
    await sql`
      update admin_users 
      set password_hash = ${newHash} 
      where id = ${admin.id}
    `;

    // 3. Remove temp password from partner record (if any)
    const partners = await sql`select id, contact_details from ecosystem_partners where user_id = ${admin.id}`;
    if (partners.length > 0) {
      const contactDetails = partners[0].contact_details || {};
      if (contactDetails.tempPassword) {
        delete contactDetails.tempPassword;
        await sql`
          update ecosystem_partners
          set contact_details = ${JSON.stringify(contactDetails)}::jsonb
          where id = ${partners[0].id}
        `;
      }
    }

    // Do same for companies if portal users can be companies
    const companies = await sql`select id, contact_details from companies where user_id = ${admin.id}`;
    if (companies.length > 0) {
      const contactDetails = companies[0].contact_details || {};
      if (contactDetails.tempPassword) {
        delete contactDetails.tempPassword;
        await sql`
          update companies
          set contact_details = ${JSON.stringify(contactDetails)}::jsonb
          where id = ${companies[0].id}
        `;
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Failed to change password:", err);
    return json({ ok: false, error: "Internal server error" }, 500);
  }
}
