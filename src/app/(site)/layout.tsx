import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SmoothScroll from "@/components/SmoothScroll";
import PaymentReturnCatcher from "@/components/PaymentReturnCatcher";

/**
 * The marketing site's chrome - header, footer, smooth scroll, the payment
 * return catcher. Scoped to this route group (not the true root layout) so
 * /admin gets none of it: its own layout (src/app/admin/layout.tsx) supplies
 * AdminShell instead, and previously had no way to opt out of this chrome
 * since the root layout rendered it unconditionally around every route.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <PaymentReturnCatcher />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
