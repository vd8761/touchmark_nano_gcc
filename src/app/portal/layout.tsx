import type { Metadata } from "next";
import { currentAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Partner Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAdmin().catch(() => null);
  
  return <AdminShell user={user}>{children}</AdminShell>;
}
