import type { Metadata } from "next";
import { Suspense } from "react";
import Section from "@/components/Section";
import PaymentReturn from "@/components/PaymentReturn";

export const metadata: Metadata = {
  title: "Payment status",
  description: "Confirming your Nano GCC membership payment.",
  // A receipt has no business in search results.
  robots: { index: false, follow: false },
};

/**
 * Landing page for the return from originbi.com.
 *
 * The shell is server-rendered so the page paints instantly, and the status
 * itself is resolved client-side against /api/order-status - the buyer sees
 * "confirming" straight away rather than a blank wait on a server round trip.
 */
export default function MembershipReturnPage() {
  return (
    <Section index="01" label="Membership" size="lg">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Suspense fallback={null}>
          <PaymentReturn />
        </Suspense>
      </div>
    </Section>
  );
}
