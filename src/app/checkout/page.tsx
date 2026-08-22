import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata: Metadata = {
  title: "Secure payment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where buyers actually pay - on nanogcc's own domain throughout.
 *
 * Razorpay's live gateway isn't approved for this domain, so a second site
 * (Summit-2026, see ORIGINBI-INTEGRATION.md) creates the Razorpay order on
 * our behalf, over a plain CORS-enabled API call. Nothing about that is
 * visible here: this is a real page on this domain, real top-level
 * navigation the whole time - no iframe, no proxy - so UPI app-switching,
 * netbanking redirects and OTP pages all work exactly as they would on any
 * other Razorpay integration. The buyer never sees or navigates to the
 * other domain at all.
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}

function CheckoutFallback() {
  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-spin" aria-hidden="true" />
        <h1>Loading&hellip;</h1>
      </div>
    </div>
  );
}
