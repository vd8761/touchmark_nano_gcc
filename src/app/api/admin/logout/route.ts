/** POST /api/admin/logout - revokes the session row and clears the cookie. */

import type { NextRequest } from "next/server";
import { logout, SESSION_COOKIE } from "@/lib/auth";
import { badRequest, json, sameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return badRequest("Request blocked.");

  await logout();

  const res = json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
