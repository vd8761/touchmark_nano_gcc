import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { DashboardNetworkCard } from "@/components/admin/DashboardNetworkCard";
import { DashboardPanel, NetworkMemberFeed, CountryDistributionList, StudentPlacementFeed, CorporateProfileFeed } from "@/components/admin/DashboardFeed";
import { formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NetworkDashboard() {
  const admin = await requireAdmin();

  // 1. Network Summary
  const networkRows = (await sql()`
    select
      (select count(*) from colleges)::int as colleges_total,
      (select count(*) from colleges where status = 'ACTIVE')::int as colleges_active,
      (select count(*) from ecosystem_partners)::int as partners_total,
      (select count(*) from ecosystem_partners where nda_status = 'NDA_SIGNED' or nda_status = 'ACTIVE')::int as partners_active,
      (select count(*) from companies)::int as corporates_total,
      (select count(*) from companies where nda_status = 'NDA_SIGNED' or nda_status = 'ACTIVE')::int as corporates_active,
      (select count(*) from students)::int as students_total,
      (select count(*) from students where category = 'INTERNSHIP')::int as students_internship,
      (select count(*) from students where category = 'OFFER')::int as students_offer
  `) as any[];
  const n = networkRows[0];

  // 2. Placement Activity
  const placementRows = (await sql()`
    select
      (select count(*) from students where category = 'INTERNSHIP' and status = 'ACTIVE')::int as active_internships,
      (select count(*) from students where category = 'INTERNSHIP' and status = 'COMPLETED')::int as completed_internships,
      (select count(*) from students where category = 'OFFER')::int as placement_offers,
      (select count(*) from students where status = 'ACTIVE')::int as in_progress
  `) as any[];
  const p = placementRows[0];

  // 3. Operational Alerts
  const opsRows = (await sql()`
    select
      (select count(*) from memberships where status = 'active')::int as active_memberships,
      (select count(*) from orders where status in ('created', 'pending') and created_at < now() - interval '1 hour')::int as stuck_orders,
      (select count(*) from email_events where status in ('bounced', 'complained', 'failed') and created_at > now() - interval '30 days')::int as bounced_emails,
      (select count(*) from memberships m join orders o on o.id = m.order_id where m.welcome_email_sent_at is null and o.status = 'paid')::int as unsent_receipts,
      (select count(*) from enquiries where status = 'new')::int as new_enquiries,
      (select count(*) from enquiries where created_at > date_trunc('month', now()))::int as enquiries_month
  `) as any[];
  const o = opsRows[0];
  const needsAttention = o.stuck_orders + o.bounced_emails + o.unsent_receipts;

  // 4. Feeds
  // Network members (recent 15)
  const recentMembers = (await sql()`
    select * from (
      select name, 'Partner' as type, created_at from ecosystem_partners
      union all
      select name, 'Corporate' as type, created_at from companies
      union all
      select name, 'College' as type, created_at from colleges
    ) combined
    order by created_at desc
    limit 15
  `) as any[];

  // Country breakdown (from JSONB in partners and companies)
  // Fallback to "India" if no country specified, since most are from GCC hub
  const countryRows = (await sql()`
    select country, count(*) as count from (
      select coalesce(contact_details->>'country', 'India') as country from ecosystem_partners
      union all
      select coalesce(contact_details->>'country', 'India') as country from companies
    ) combined
    group by country
    order by count desc
    limit 5
  `) as any[];

  // Recent Students
  const recentStudents = (await sql()`
    select s.name, s.category, s.status, s.created_at, c.name as company_name, col.name as college_name
    from students s
    left join companies c on s.company_id = c.id
    left join colleges col on s.college_id = col.id
    order by s.created_at desc
    limit 10
  `) as any[];

  // Recent Corporates Profile
  const recentCorporates = (await sql()`
    select name, contact_details, created_at
    from companies
    order by created_at desc
    limit 10
  `) as any[];



  return (
    <div style={{ paddingBottom: "64px" }}>
      <div style={{
        background: "linear-gradient(135deg, var(--panel) 0%, var(--seed) 100%)",
        borderRadius: "16px",
        padding: "32px",
        color: "var(--paper)",
        marginBottom: "40px",
        boxShadow: "0 10px 30px rgba(30, 58, 138, 0.2)"
      }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: 700 }}>Dashboard Overview</h1>
        <p style={{ margin: 0, fontSize: "1.05rem", opacity: 0.9 }}>
          Welcome back, {admin.email}. Here is what's happening in the Touchmark Nano GCC Hub today.
        </p>
      </div>

      {/* Section 1 — Network Summary Cards */}
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>Network Ecosystem</h2>
      </div>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "16px",
        marginBottom: "40px"
      }}>
        <DashboardNetworkCard
          title="Institutions"
          icon="🏫"
          gradient="linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)"
          mainCount={n.colleges_total}
          mainLabel="Total"
          subCount1={n.colleges_active}
          subLabel1="Active"
          subCount2={n.colleges_total - n.colleges_active}
          subLabel2="Expired"
          href="/admin/memberships/"
        />
        <DashboardNetworkCard
          title="Ecosystem Partners"
          icon="🤝"
          gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
          mainCount={n.partners_total}
          mainLabel="Total"
          subCount1={n.partners_active}
          subLabel1="Active"
          subCount2={n.partners_total - n.partners_active}
          subLabel2="Pending NDA"
          href="/admin/partners/"
        />
        <DashboardNetworkCard
          title="Corporates"
          icon="🏢"
          gradient="linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
          mainCount={n.corporates_total}
          mainLabel="Total"
          subCount1={n.corporates_active}
          subLabel1="Active"
          subCount2={n.corporates_total - n.corporates_active}
          subLabel2="Pending NDA"
          href="/admin/companies/"
        />
        <DashboardNetworkCard
          title="Students"
          icon="🎓"
          gradient="linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)"
          mainCount={n.students_total}
          mainLabel="Total"
          subCount1={n.students_internship}
          subLabel1="Internships"
          subCount2={n.students_offer}
          subLabel2="Offers"
          href="/admin/students/"
        />
      </div>

      {/* Section 2 & 3 — Placement & Ops */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        
        {/* Placement Activity Summary */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>Placement Activity</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>, label: 'Active Internships', count: p.active_internships, desc: 'Currently undergoing internship', color: '#3b82f6' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, label: 'Completed', count: p.completed_internships, desc: 'Successfully completed', color: '#10b981' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, label: 'Placement Offers', count: p.placement_offers, desc: 'Direct job offers', color: '#8b5cf6' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.22-10.27l-3.32-3.32"/></svg>, label: 'In Progress', count: p.in_progress, desc: 'Active across all categories', color: '#f59e0b' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: "white", borderRadius: "12px", padding: "20px", border: "1px solid var(--paper-2)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink-soft)", fontWeight: 500, fontSize: "0.9rem" }}>
                  <span style={{ display: "flex", alignItems: "center", color: stat.color }}>{stat.icon}</span> {stat.label}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Alerts */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>Operational Alerts</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label: 'Active Memberships', count: o.active_memberships, desc: 'Platform active users', color: '#10b981', bg: 'white' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: 'Needs Attention', count: needsAttention, desc: needsAttention > 0 ? `${o.stuck_orders} stuck, ${o.unsent_receipts} unsent, ${o.bounced_emails} bounced` : 'Nothing outstanding', color: needsAttention > 0 ? '#ef4444' : '#10b981', bg: needsAttention > 0 ? '#fef2f2' : 'white' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'New Enquiries', count: o.new_enquiries, desc: 'Untriaged enquiries', color: o.new_enquiries > 0 ? '#f59e0b' : '#6b7280', bg: o.new_enquiries > 0 ? '#fffbeb' : 'white' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, label: 'This Month', count: o.enquiries_month, desc: 'Total enquiries received', color: '#3b82f6', bg: 'white' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: stat.bg, borderRadius: "12px", padding: "20px", border: `1px solid ${stat.bg === 'white' ? 'var(--paper-2)' : stat.color + '40'}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink-soft)", fontWeight: 500, fontSize: "0.9rem" }}>
                  <span style={{ display: "flex", alignItems: "center", color: stat.color }}>{stat.icon}</span> {stat.label}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4 — Corporate Profiles Overview */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>Corporate Ecosystem Highlights</h2>
      <p style={{ fontSize: "0.95rem", color: "var(--ink-soft)", margin: "0 0 24px" }}>A snapshot of our top corporate partners and their business scale.</p>
      <CorporateProfileFeed companies={recentCorporates} />

      {/* Section 5 — Activity Feeds */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)", margin: "32px 0 16px" }}>Recent Activity</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px", height: "400px" }}>
        <DashboardPanel title="Newly Joined Members">
          <NetworkMemberFeed items={recentMembers} />
        </DashboardPanel>
        
        <DashboardPanel title="Country Distribution">
          <CountryDistributionList items={countryRows} />
        </DashboardPanel>

        <DashboardPanel title="Recent Student Placements">
          <StudentPlacementFeed students={recentStudents} />
        </DashboardPanel>
      </div>


    </div>
  );
}
