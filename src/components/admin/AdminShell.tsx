"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Admin chrome.
 *
 * Renders bare on /admin/login (there is nobody to show a nav bar to yet), and
 * with the full bar everywhere else.
 */

const NAV_ITEMS = [
  { href: "/admin/dashboard/", label: "Dashboard", exact: true },
  { 
    label: "Network", 
    subItems: [
      { href: "/admin/memberships/", label: "Institutions" },
      { href: "/admin/partners/", label: "Ecosystem Partners" },
      { href: "/admin/companies/", label: "Corporates" },
      { href: "/admin/students/", label: "Students" },
    ]
  },
  { 
    label: "Operations", 
    subItems: [
      { href: "/admin/payment-activity/", label: "Payment Activity" },
      { href: "/admin/enquiries/", label: "Enquiries" },
      { href: "/admin/payments/", label: "Payments" },
      { href: "/admin/emails/", label: "Emails" },
    ]
  },
  { 
    label: "Settings", 
    subItems: [
      { href: "/admin/settings/agreements/", label: "Legal Agreements & MoUs" },
      { href: "/admin/settings/pricing/", label: "Institution Pricing" },
    ]
  },
];

type User = { id: string; email: string; name: string | null; role?: string } | null;

export default function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
      <header className="adm-bar">
        <span className="adm-brand">
          {user.role === 'ADMIN' ? 'Nano GCC Admin' : 'Touchmark NANO GCC'}
        </span>

        <nav>
          {user.role === 'ADMIN' && NAV_ITEMS.map((item) => {
            if (item.subItems) {
              const isActive = item.subItems.some(sub => pathname?.startsWith(sub.href.replace(/\/$/, "")));
              return (
                <div key={item.label} className="adm-dropdown">
                  <button className={`adm-dropdown-btn ${isActive ? 'on' : ''}`}>
                    {item.label} ▾
                  </button>
                  <div className="adm-dropdown-content">
                    {item.subItems.map(sub => {
                      const isSubActive = pathname?.startsWith(sub.href.replace(/\/$/, ""));
                      return (
                        <Link 
                          key={sub.href} 
                          href={sub.href} 
                          className={isSubActive ? 'on' : undefined}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const current = item.exact
              ? pathname === item.href || pathname === "/admin"
              : pathname?.startsWith(item.href.replace(/\/$/, ""));

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={current ? "on" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="adm-who">
          <span>{user.name ?? user.email}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="adm-main">{children}</main>
    </div>
  );
}
