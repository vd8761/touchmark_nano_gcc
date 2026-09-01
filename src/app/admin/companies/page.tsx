import React from "react";
import Link from "next/link";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ResetCompanyPasswordInline from "@/components/admin/ResetCompanyPasswordInline";
import CompanyActions from "@/components/admin/CompanyActions";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  await requireAdmin();

  const companies = await sql()`
    select c.*, u.email, ep.name as partner_name 
    from companies c
    join admin_users u on u.id = c.user_id
    left join ecosystem_partners ep on ep.id = c.ecosystem_partner_id
    order by c.created_at desc
  `;

  return (
    <div className="adm-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="adm-h1">Corporates</h1>
          <p className="adm-sub">Manage corporates participating in the Nano GCC ecosystem.</p>
        </div>
        <div className="acts">
          <Link href="/admin/companies/new" className="act primary">
            + Add Corporate
          </Link>
        </div>
      </div>

      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              <th>CORPORATE NAME</th>
              <th>CONTACT & LOCATION</th>
              <th>PARTNER</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>MOU STATUS</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Password</th>
              <th style={{ width: "1%", whiteSpace: "nowrap" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--ink-faint)" }}>
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td className="wrap">
                    <Link href={`/admin/companies/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <strong style={{ color: "var(--brand-primary)" }}>{c.name}</strong>
                    </Link>
                    <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{c.email}</div>
                  </td>
                  <td className="wrap">
                    <div style={{ fontSize: "0.9em", color: "var(--ink)" }}>{c.contact_details?.phone || 'No phone'}</div>
                    <div style={{ fontSize: "0.85em", color: "var(--ink-soft)" }}>{c.contact_details?.location || 'No location'} {c.contact_details?.country ? `, ${c.contact_details.country}` : ''}</div>
                  </td>
                  <td className="wrap">
                    {c.partner_name || <span style={{ color: "var(--ink-faint)", fontStyle: "italic" }}>Direct</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <CompanyActions id={c.id} initialStatus={c.nda_status || "PENDING_NDA"} />
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <ResetCompanyPasswordInline 
                      companyId={c.id} 
                      initialTempPassword={c.contact_details?.tempPassword} 
                    />
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
