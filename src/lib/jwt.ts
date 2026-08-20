/**
 * Minimal HS256 JWT, for the cross-domain handoff to originbi.com.
 *
 * Hand-rolled rather than pulling in `jsonwebtoken`: we sign and verify exactly
 * one token shape, and the whole algorithm is thirty lines of `node:crypto`.
 * The wire format is standard, so originbi's `jsonwebtoken.verify()` reads
 * these tokens without knowing they came from here.
 *
 * Both sides share `CROSS_DOMAIN_SECRET`. That secret is what proves the amount
 * inside the token was calculated by our server and not typed into an address
 * bar - so it must never reach the browser.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

type Header = { alg: "HS256"; typ: "JWT" };

export type CheckoutClaims = {
  /** Our order reference. originbi echoes this back on completion. */
  ref: string;
  /** Paise, GST-inclusive. The authoritative amount. */
  amount: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  /** Plan/tier identifier, for originbi's records. */
  tier: string;
  /** Where originbi returns the buyer once payment resolves. */
  callback: string;
  /** Where originbi POSTs the completion, server- or client-side. */
  notify: string;
  /** Issued-at and expiry, seconds since epoch (standard JWT claims). */
  iat: number;
  exp: number;
};

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(signingInput: string, secret: string): string {
  return createHmac("sha256", secret).update(signingInput).digest("base64url");
}

export function signJwt(claims: Omit<CheckoutClaims, "iat" | "exp">, secret: string, ttlSeconds = 900): string {
  const now = Math.floor(Date.now() / 1000);

  const header: Header = { alg: "HS256", typ: "JWT" };
  const payload: CheckoutClaims = { ...claims, iat: now, exp: now + ttlSeconds };

  const signingInput = `${encode(header)}.${encode(payload)}`;
  return `${signingInput}.${signature(signingInput, secret)}`;
}

/**
 * Verifies and decodes a token. Returns null on any problem - bad shape, wrong
 * algorithm, bad signature, or expired.
 *
 * The `alg` check matters: accepting whatever the token names would let an
 * attacker set `"alg":"none"` and hand us unsigned claims.
 */
export function verifyJwt(token: string, secret: string): CheckoutClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, provided] = parts as [string, string, string];

  let header: Header;
  try {
    header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  const expected = signature(`${encodedHeader}.${encodedPayload}`, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims: CheckoutClaims;
  try {
    claims = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) return null;

  return claims;
}
