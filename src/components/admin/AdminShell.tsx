"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, ChevronLeft, ChevronRight, LogOut } from "lucide-react";

/**
 * Admin chrome.
 *
 * Renders bare on /admin/login (there is nobody to show a nav bar to yet), and
 * with the full bar everywhere else.
 */

type NavItem = {
  href?: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  subItems?: { href: string; label: string; exact?: boolean }[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard/", label: "Dashboard", icon: <LayoutDashboard size={20} />, exact: true },
  { 
    label: "Network",
    icon: <Users size={20} />,
    subItems: [
      { href: "/admin/partners/", label: "Ecosystem Partners" },
      { href: "/admin/companies/", label: "Companies" },
      { href: "/admin/institutions/", label: "Institutions" },
    ]
  },
  { 
    label: "Operations",
    icon: <Briefcase size={20} />,
    subItems: [
      { href: "/admin/batches/", label: "Batches" },
      { href: "/admin/students/", label: "Students" },
      { href: "/admin/enquiries/", label: "Enquiries" },
      { href: "/admin/payments/", label: "Payments" },
    ]
  },
  { 
    label: "Settings",
    icon: <Settings size={20} />,
    subItems: [
      { href: "/admin/settings/agreements/", label: "Legal Agreements" },
      { href: "/admin/settings/general/", label: "General Settings" },
    ]
  },
];

type User = { id: string; email: string; name: string | null; role?: string } | null;

export default function AdminShell({
  children,
  user,
  defaultCollapsed = false,
}: {
  children: React.ReactNode;
  user: User;
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [expandedNav, setExpandedNav] = React.useState<string | null>(null);
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  React.useEffect(() => {
    // Automatically expand the section that matches the current route
    NAV_ITEMS.forEach(item => {
      if (item.subItems && item.subItems.some(sub => pathname?.startsWith(sub.href.replace(/\/$/, "")))) {
        setExpandedNav(item.label);
      }
    });
  }, [pathname]);

  if (pathname?.startsWith("/admin/login") || pathname?.startsWith("/portal/login") || !user) {
    return <>{children}</>;
  }

  const signOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login/");
    router.refresh();
  };

  return (
    <div className="adm">
      {/* Mobile Header */}
      <div className="adm-mobile-header">
        <Link href="/admin/dashboard" className="adm-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/brand/touchmark-logo-white.svg" alt="Touchmark" style={{ height: "24px", display: "block" }} />
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFFFFF", fontWeight: 700, marginLeft: "12px", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>NANO GCC</span>
        </Link>
        <button className="adm-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`adm-sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
        <aside className={`adm-sidebar ${mobileMenuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="adm-sidebar-header">
            <Link href="/admin/dashboard" className="adm-brand adm-brand-desktop" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginBottom: 0 }}>
              <img 
                src={isCollapsed ? "https://touchmarkwf.com/timesheet/front_assets/images/logo/logoT.png" : "/brand/touchmark-logo.png"} 
                alt="Touchmark" 
                style={{ height: isCollapsed ? "28px" : "22px", display: "block", objectFit: "contain" }} 
              />
              {!isCollapsed && (
                <span style={{ 
                  fontSize: "0.65rem", 
                  letterSpacing: "0.08em", 
                  textTransform: "uppercase", 
                  color: "#0F172A", 
                  fontWeight: 700, 
                  marginLeft: "8px", 
                  paddingLeft: "8px", 
                  borderLeft: "1px solid #E2E8F0",
                  whiteSpace: "nowrap"
                }}>
                  NANO GCC
                </span>
              )}
            </Link>
          </div>

          <nav style={{ marginTop: '32px' }}>
          {user.role === 'ADMIN' && NAV_ITEMS.map((item) => {
            if (item.subItems) {
              const isActive = item.subItems.some(sub => pathname?.startsWith(sub.href.replace(/\/$/, "")));
              const isExpanded = expandedNav === item.label && !isCollapsed;
              return (
                <div 
                  key={item.label} 
                  className="adm-nav-dropdown"
                  onMouseEnter={() => isCollapsed && setHoveredNav(item.label)}
                  onMouseLeave={() => isCollapsed && setHoveredNav(null)}
                >
                  <button 
                    className={`adm-nav-dropdown-btn ${isActive ? 'on' : ''} ${isCollapsed ? 'collapsed-btn' : ''}`}
                    onClick={() => {
                      if (isCollapsed) return;
                      setExpandedNav(isExpanded ? null : item.label);
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', width: '100%' }}>
                      {item.icon}
                      {!isCollapsed && <span style={{ marginLeft: '12px' }}>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    )}
                  </button>
                  {((isExpanded && !isCollapsed) || (isCollapsed && hoveredNav === item.label)) && (
                    <div className="adm-nav-dropdown-content">
                      {/* Bulletproof DOM-based hover bridge for collapsed mode gap */}
                      {isCollapsed && (
                        <div style={{ position: 'absolute', left: '-16px', width: '16px', top: '-4px', bottom: '-4px', background: 'transparent', zIndex: 1 }} />
                      )}
                      {item.subItems.map(sub => {
                        const isSubActive = sub.exact
                          ? pathname === sub.href || pathname === sub.href.replace(/\/$/, "")
                          : pathname?.startsWith(sub.href.replace(/\/$/, ""));
                        return (
                          <Link key={sub.href} href={sub.href} className={isSubActive ? 'on' : undefined}>
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const current = item.exact
              ? pathname === item.href || pathname === "/admin"
              : pathname?.startsWith(item.href!.replace(/\/$/, ""));

            return (
              <Link key={item.href!} href={item.href!} className={`adm-nav-link ${current ? 'on' : ''} ${isCollapsed ? 'collapsed-btn' : ''}`} title={isCollapsed ? item.label : undefined}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', width: '100%' }}>
                  {item.icon}
                  {!isCollapsed && <span style={{ marginLeft: '12px' }}>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="adm-who" style={{ alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {!isCollapsed && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div className="adm-avatar-pill">
                <div className="adm-avatar-circle" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 600, border: '1px solid #E2E8F0' }}>
                  {(user.name ?? user.email.split('@')[0]).charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="adm-avatar-name" style={{ color: '#0F172A', fontWeight: 600, marginBottom: '2px' }}>{user.name ?? 'Admin User'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>{user.email}</span>
                  <span style={{ 
                    background: 'rgba(2, 132, 199, 0.08)', color: '#0284C7', 
                    padding: '3px 8px', borderRadius: '4px', 
                    fontSize: '0.6rem', fontWeight: 700, 
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    border: '1px solid rgba(2, 132, 199, 0.15)',
                    display: 'inline-block'
                  }}>
                    {user.role === 'ADMIN' ? 'Administrator' : 'Portal User'}
                  </span>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="adm-avatar-circle" style={{ marginBottom: '16px', width: '36px', height: '36px', margin: '0 auto 24px auto', background: '#F1F5F9', color: '#0F172A', fontWeight: 600, border: '1px solid #E2E8F0' }} title={user.email}>
              {(user.name ?? user.email.split('@')[0]).charAt(0).toUpperCase()}
            </div>
          )}
          <button type="button" onClick={signOut} className="adm-signout-btn" title={isCollapsed ? "Sign out" : undefined} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px' : '12px 16px', color: '#475569' }}>
            <LogOut size={16} style={{ marginRight: isCollapsed ? '0' : '12px', color: '#64748B' }} />
            {!isCollapsed && "Sign out"}
          </button>
        </div>
      </aside>
      
      <button className="adm-collapse-toggle" onClick={() => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        setExpandedNav(null);
        document.cookie = `sidebar_collapsed=${newState}; path=/; max-age=31536000`;
      }} title="Toggle Sidebar">
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>

    <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</main>
  </div>
  );
}

// trigger recompile




// trigger

// Trigger update 2

// Trigger update 3

// Trigger update 4

// Trigger update 5

// Trigger update 6

// Trigger update 7

// Trigger update 8

// Trigger update 9
