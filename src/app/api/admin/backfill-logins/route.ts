import type { NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { json } from "@/lib/request";
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/crypto";
import { send } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  try {
    const q = sql();
    
    // Also clear any stuck "PENDING" receipts
    await q`update memberships set welcome_email_sent_at = now() where welcome_email_sent_at is null`;

    // Find all active memberships that don't have an admin_users account
    const memberships = await q`
      select m.* 
      from memberships m
      left join admin_users a on m.email = a.email
      where a.id is null and m.status = 'active'
    `;

    if (memberships.length === 0) {
      return json({ ok: true, message: "No institutions need backfilling." });
    }

    let createdCount = 0;
    
    for (const membership of memberships) {
      const tempPassword = randomBytes(4).toString("hex");
      const tempPasswordHash = hashPassword(tempPassword);
      
      // 1. Create the user account
      await q`
        insert into admin_users (email, password_hash, name, role)
        values (${membership.email}, ${tempPasswordHash}, ${membership.institution}, 'COLLEGE')
        on conflict (email) do nothing
      `;

      // 2. Email the credentials immediately (Option A)
      await send({
        to: membership.email,
        template: "welcome-institution",
        message: welcomeEmail({
          roleDisplay: "Academic Partner",
          name: membership.name || "Partner",
          email: membership.email,
          tempPassword: tempPassword,
          loginUrl: `${env.siteUrl}/portal/login`,
        }),
      }).catch(console.error); 
      
      createdCount++;
    }

    return json({ 
      ok: true, 
      message: `Successfully backfilled ${createdCount} institution(s) with portal logins and emailed their credentials.` 
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Backfill error:", message);
    return json({ ok: false, error: "Backfill failed." }, 500);
  }
}
