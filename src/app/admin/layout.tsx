import type { Metadata } from "next";
import { currentAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Every admin page reads live data and the session cookie, so none of it may
// be cached or prerendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Null on the login page, which shares this layout. The shell renders the
  // chrome only when there is somebody to render it for.
  const admin = await currentAdmin().catch(() => null);

  return <AdminShell user={admin}>{children}</AdminShell>;
}
