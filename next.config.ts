import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Marketing pages are still statically prerendered at build time - Next does
  // that by default for any route without dynamic data. What we can no longer
  // do is `output: "export"`, because the membership flow needs real server
  // routes: DB access, the Razorpay/Resend webhooks and the admin session
  // check all run on Vercel functions.
  trailingSlash: true,

  // Without this, `trailingSlash` makes Next 308-redirect /api/foo to
  // /api/foo/ - including the webhook endpoints. Razorpay and Resend post to
  // the URL exactly as configured, and webhook senders generally do not follow
  // redirects, so a captured payment would simply never be reported. Turning
  // the redirect off lets both spellings serve directly. Caught by the local
  // Docker stack; it would have been invisible until the first live payment.
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
};

export default nextConfig;
