"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/**
 * Admin chrome.
 *
 * Renders bare on /admin/login (there is nobody to show a nav bar to yet), and
 * with the full bar everywhere else.
 */

const LINKS = [
  { href: "/admin/", label: "Dashboard", exact: true },
  { href: "/admin/enquiries/", label: "Enquiries" },
  { href: "/admin/payments/", label: "Payments" },
  { href: "/admin/memberships/", label: "Memberships" },
  { href: "/admin/emails/", label: "Emails" },
];

type User = { id: string; email: string; name: string | null } | null;

export default function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith("/admin/login") || !user) {
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
        <span className="adm-brand">DOS Club Admin</span>

        <nav>
          {LINKS.map((link) => {
            const current = link.exact
              ? pathname === link.href || pathname === "/admin"
              : pathname?.startsWith(link.href.replace(/\/$/, ""));

            return (
              <Link key={link.href} href={link.href} className={current ? "on" : undefined}>
                {link.label}
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
