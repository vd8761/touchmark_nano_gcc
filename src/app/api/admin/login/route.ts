/**
 * POST /api/admin/login
 *
 * Sets the session cookie on success. Errors are deliberately vague - the
 * login form must not reveal which admin addresses exist.
 */

import type { NextRequest } from "next/server";
import { login, sessionCookieOptions, sessionCookieValue, SESSION_COOKIE } from "@/lib/auth";
import { badRequest, clientIpHash, json, sameOrigin, userAgent } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return badRequest("Malformed request.");
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) return badRequest("Enter your email and password.");

  const result = await login(email, password, {
    ipHash: clientIpHash(req),
    userAgent: userAgent(req),
  });

  if (!result.ok) {
    return json(
      {
        ok: false,
        error:
          result.reason === "locked"
            ? "Too many failed attempts. Try again in 15 minutes."
            : "Invalid email or password.",
      },
      401,
    );
  }

  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionCookieValue(result.sessionId), sessionCookieOptions());
  return res;
}
