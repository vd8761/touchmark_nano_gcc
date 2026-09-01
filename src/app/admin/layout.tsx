import type { Metadata } from "next";
import { currentAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { cookies } from "next/headers";
import "./admin-sidebar.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Every admin page reads live data and the session cookie, so none of it may
// be cached or prerendered.
export const dynamic = "force-dynamic";

import { Toaster } from "react-hot-toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Null on the login page, which shares this layout. The shell renders the
  // chrome only when there is somebody to render it for.
  let admin = await currentAdmin().catch(() => null);
  // Ensure we rely purely on actual session auth, mock user removed per request.

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";

  return (
    <>
      <Toaster position="top-center" />
      <AdminShell user={admin} defaultCollapsed={defaultCollapsed}>{children}</AdminShell>
    </>
  );
}
