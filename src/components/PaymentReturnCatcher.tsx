"use client";

import { useEffect } from "react";

/**
 * Catches a payment return that lands somewhere other than the receipt page.
 *
 * originbi's checkout redirects to a callback URL, and the one we hand it in
 * the JWT points at /membership/return/. But a misconfigured or older callback
 * can drop a paying buyer on the site root with `?payment=success` instead.
 * Rather than showing them the marketing homepage moments after they paid,
 * forward them to the receipt.
 *
 * Mounted once in the root layout. Renders nothing, and does nothing at all on
 * the overwhelming majority of page views.
 */
export default function PaymentReturnCatcher() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("payment")) return;

    // Already where we want them.
    if (window.location.pathname.startsWith("/membership/return")) return;

    const target = new URL("/membership/return/", window.location.origin);
    for (const key of ["ref", "payment"]) {
      const value = params.get(key);
      if (value) target.searchParams.set(key, value);
    }

    // `replace`, so Back doesn't bounce them straight out again.
    window.location.replace(target.toString());
  }, []);

  return null;
}
