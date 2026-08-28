/**
 * Gate on /admin.
 *
 * Runs on the edge, where `node:crypto` and the Neon driver are unavailable -
 * so this only checks that the cookie carries a valid HMAC. Whether the
 * session is still live (not expired, not revoked, user still active) is
 * checked by `requireAdmin()` inside each page, against the database.
 *
 * The split is deliberate: middleware turns away the overwhelming majority of
 * unauthenticated traffic without a DB round trip, and the authoritative check
 * still happens where it can be authoritative.
 */

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dos_admin_session";

async function hasValidSignature(signed: string, secret: string): Promise<boolean> {
  const index = signed.lastIndexOf(".");
  if (index <= 0) return false;

  const value = signed.slice(0, index);
  const signature = signed.slice(index + 1);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const expected = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Length-independent constant-time-ish compare.
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login pages and their POST handlers have to stay reachable.
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/portal/login")) return NextResponse.next();

  const secret = process.env.SESSION_SECRET;
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;

  console.log("Middleware check:", { hasSecret: !!secret, hasCookie: !!cookie });

  if (secret && cookie) {
    const valid = await hasValidSignature(cookie, secret);
    console.log("Middleware valid:", valid);
    if (valid) {
      return NextResponse.next();
    }
  }

  const login = req.nextUrl.clone();
  
  // Decide which login page to send them to based on where they were going
  const isPortal = pathname.startsWith("/portal");
  login.pathname = isPortal ? "/portal/login/" : "/admin/login/";
  login.search = "";
  
  // Bring the user back to where they were headed after signing in.
  if (pathname !== "/admin" && pathname !== "/admin/" && pathname !== "/portal" && pathname !== "/portal/") {
    login.searchParams.set("next", pathname);
  }

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
