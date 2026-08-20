/**
 * Admin authentication.
 *
 * Sessions are server-side rows, not self-contained tokens. The cookie only
 * carries a session id plus an HMAC of it - so logging out, or disabling an
 * account, revokes access immediately. A stateless JWT could not do that
 * without a blocklist, which is the same table with extra steps.
 *
 * Node-only (scrypt). The middleware deliberately does *not* import this; it
 * verifies the cookie signature with Web Crypto and leaves the DB check to the
 * pages themselves.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql, type AdminUser } from "./db";
import { env } from "./env";
import { sign, unsign, verifyPassword } from "./crypto";

export const SESSION_COOKIE = "dos_admin_session";
const SESSION_HOURS = 8;

/** Failed logins allowed per email+IP before the pair is locked out. */
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;

export type AdminSessionUser = Pick<AdminUser, "id" | "email" | "name">;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginOutcome =
  | { ok: true; user: AdminSessionUser; sessionId: string }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * Verifies credentials and opens a session.
 *
 * Returns the same `invalid` reason for an unknown email, a wrong password and
 * a deactivated account - the login form must not become a way to discover
 * which admin addresses exist.
 */
export async function login(
  email: string,
  password: string,
  context: { ipHash: string; userAgent: string },
): Promise<LoginOutcome> {
  const q = sql();
  const normalized = email.trim().toLowerCase();

  const attempts = (await q`
    select count(*)::int as count
      from admin_login_attempts
     where lower(email) = ${normalized}
       and ip_hash = ${context.ipHash}
       and successful = false
       and created_at > now() - (${ATTEMPT_WINDOW_MINUTES} || ' minutes')::interval
  `) as { count: number }[];

  if ((attempts[0]?.count ?? 0) >= MAX_ATTEMPTS) return { ok: false, reason: "locked" };

  const users = (await q`
    select * from admin_users where lower(email) = ${normalized}
  `) as AdminUser[];

  const user = users[0];
  const valid = user?.is_active === true && verifyPassword(password, user.password_hash);

  if (!valid) {
    await q`
      insert into admin_login_attempts (email, ip_hash, successful)
      values (${normalized}, ${context.ipHash}, false)
    `;
    return { ok: false, reason: "invalid" };
  }

  const sessions = (await q`
    insert into admin_sessions (admin_user_id, expires_at, ip_hash, user_agent)
    values (${user.id}, now() + (${SESSION_HOURS} || ' hours')::interval,
            ${context.ipHash}, ${context.userAgent})
    returning id
  `) as { id: string }[];

  await q`update admin_users set last_login_at = now() where id = ${user.id}`;

  // A successful login clears the lockout counter for this email+IP.
  await q`
    delete from admin_login_attempts
     where lower(email) = ${normalized} and ip_hash = ${context.ipHash}
  `;

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    sessionId: sessions[0]!.id,
  };
}

// ---------------------------------------------------------------------------
// Cookie
// ---------------------------------------------------------------------------

export function sessionCookieValue(sessionId: string): string {
  return sign(sessionId, env.sessionSecret);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

// ---------------------------------------------------------------------------
// Reading the current session
// ---------------------------------------------------------------------------

/**
 * The authenticated admin, or null.
 *
 * Checks the signature *and* the session row on every call: an expired,
 * revoked or deleted session stops working immediately, and so does a
 * deactivated user.
 */
export async function currentAdmin(): Promise<AdminSessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const sessionId = unsign(raw, env.sessionSecret);
  if (!sessionId) return null;

  const rows = (await sql()`
    select u.id, u.email, u.name
      from admin_sessions s
      join admin_users u on u.id = s.admin_user_id
     where s.id = ${sessionId}
       and s.revoked_at is null
       and s.expires_at > now()
       and u.is_active = true
  `) as AdminSessionUser[];

  return rows[0] ?? null;
}

/**
 * Same, but redirects to the login page when absent.
 *
 * Middleware already turns unauthenticated visitors away, but every admin page
 * calls this too - defence in depth, and it is what actually types the `user`
 * value for the page.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login/");
  return admin;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;

  if (raw) {
    const sessionId = unsign(raw, env.sessionSecret);
    if (sessionId) {
      await sql()`update admin_sessions set revoked_at = now() where id = ${sessionId}`;
    }
  }

  store.delete(SESSION_COOKIE);
}
