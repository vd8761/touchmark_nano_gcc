import React from "react";
import { currentAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";

import CompanyDashboard from "@/components/portal/CompanyDashboard";
import EcosystemDashboard from "@/components/portal/EcosystemDashboard";
import CollegeDashboard from "@/components/portal/CollegeDashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await currentAdmin().catch(() => null);

  if (!user) {
    redirect("/portal/login");
  }

  // Route based on role
  if (user.role === "COMPANY") {
    const records = await sql()`
      select * from companies where user_id = ${user.id}
    `;
    const company = records[0];

    const studentRecords = company 
      ? await sql()`select * from students where company_id = ${company.id}` 
      : [];

    return <CompanyDashboard company={company} students={studentRecords} />;
  }

  if (user.role === "ECOSYSTEM_PARTNER") {
    const records = await sql()`
      select * from ecosystem_partners where user_id = ${user.id}
    `;
    const partner = records[0];

    const companyRecords = partner 
      ? await sql()`select * from companies where ecosystem_partner_id = ${partner.id}` 
      : [];

    return <EcosystemDashboard partner={partner} companies={companyRecords} />;
  }

  if (user.role === "COLLEGE") {
    // 1. Fetch official membership instead of the old colleges table
    const records = await sql()`
      select * from memberships where lower(email) = ${user.email.toLowerCase()} order by created_at desc limit 1
    `;
    const membership = records[0];

    // 2. Fetch subscription history (defensive catch in case migration hasn't run yet)
    let subscriptions = [];
    if (membership) {
      try {
        subscriptions = await sql()`
          select * from membership_subscriptions where membership_id = ${membership.id} order by valid_until desc
        `;
      } catch (err: any) {
        // Ignore if table doesn't exist yet due to pending migration
        if (!err.message?.includes("does not exist")) console.error(err);
      }
    }

    return <CollegeDashboard membership={membership} subscriptions={subscriptions} />;
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return <div>Unknown role</div>;
}
