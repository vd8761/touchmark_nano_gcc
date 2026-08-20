/**
 * Request-shaped helpers used across the API routes: client IP, CSRF origin
 * checks, JSON responses and a small DB-backed rate limiter.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sql } from "./db";
import { env } from "./env";
import { hashIp } from "./crypto";

/**
 * Client IP as seen by Vercel's edge. `x-forwarded-for` can be a list; the
 * first entry is the original client.
 */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function clientIpHash(req: NextRequest): string {
  return hashIp(clientIp(req), env.sessionSecret);
}

export function userAgent(req: NextRequest): string {
  return (req.headers.get("user-agent") ?? "").slice(0, 500);
}

/**
 * CSRF defence for cookie-authenticated mutations.
 *
 * The session cookie is SameSite=Lax, which already blocks cross-site POSTs in
 * every current browser; this is the belt to that's braces.
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  // Non-browser callers (curl, server-to-server) send no Origin at all.
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host");
    return originHost === requestHost;
  } catch {
    return false;
  }
}

/**
 * The one cross-origin caller we allow: originbi.com's checkout page, which
 * POSTs the payment completion from the buyer's browser.
 *
 * Derived from the configured checkout URL rather than hardcoded, so a staging
 * checkout on another host works without a code change. Falls back to no CORS
 * headers at all if the URL is unset or unparseable - failing closed.
 */
function checkoutOrigin(): string | null {
  try {
    return new URL(env.originbiCheckoutUrl).origin;
  } catch {
    return null;
  }
}

export function json(body: unknown, status = 200, cors = false): NextResponse {
  const headers: Record<string, string> = { "cache-control": "no-store" };

  if (cors) {
    const origin = checkoutOrigin();
    if (origin) {
      headers["access-control-allow-origin"] = origin;
      headers["access-control-allow-methods"] = "POST, OPTIONS";
      headers["access-control-allow-headers"] = "content-type";
      headers["access-control-max-age"] = "86400";
      // The allowed origin varies with configuration, so caches must not reuse
      // one origin's response for another.
      headers.vary = "Origin";
    }
  }

  return NextResponse.json(body, { status, headers });
}

export function badRequest(message: string, extra: Record<string, unknown> = {}) {
  return json({ ok: false, error: message, ...extra }, 400);
}

/**
 * Fixed-window rate limiter backed by `admin_login_attempts`.
 *
 * Reusing that table for every limiter keeps the schema small; the `email`
 * column carries the bucket name (`lookup`, `enquiry`, ...) for non-login uses.
 */
export async function rateLimit(
  bucket: string,
  ipHash: string,
  { max, windowMinutes }: { max: number; windowMinutes: number },
): Promise<{ allowed: boolean; remaining: number }> {
  const q = sql();

  const rows = (await q`
    select count(*)::int as count
      from admin_login_attempts
     where email = ${bucket}
       and ip_hash = ${ipHash}
       and successful = false
       and created_at > now() - (${windowMinutes} || ' minutes')::interval
  `) as { count: number }[];

  const count = rows[0]?.count ?? 0;
  if (count >= max) return { allowed: false, remaining: 0 };

  await q`
    insert into admin_login_attempts (email, ip_hash, successful)
    values (${bucket}, ${ipHash}, false)
  `;

  return { allowed: true, remaining: max - count - 1 };
}

/**
 * Fixed delay so lookup responses take the same time whether or not a record
 * exists. Without it, "no such member" is measurably faster than a real hit.
 */
export async function padTiming(startedAt: number, targetMs = 400): Promise<void> {
  const elapsed = Date.now() - startedAt;
  if (elapsed < targetMs) {
    await new Promise((resolve) => setTimeout(resolve, targetMs - elapsed));
  }
}
