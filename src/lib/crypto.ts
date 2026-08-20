/**
 * Signing and hashing helpers.
 *
 * All comparisons of secrets go through `safeEqual` - a plain `===` on an HMAC
 * leaks its contents through timing, and this file is used on the webhook and
 * login paths where that matters.
 */

import {
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

export function hmacHex(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Constant-time string compare that tolerates length mismatches. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so the failure path costs the same.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Non-reversible IP fingerprint, so rate-limit rows hold no personal data. */
export function hashIp(ip: string | null | undefined, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip ?? "unknown"}`).digest("hex").slice(0, 32);
}

// ---------------------------------------------------------------------------
// Public references
// ---------------------------------------------------------------------------

/** Crockford-style alphabet: no I, L, O, U, so refs survive being read aloud. */
const REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * `DOS-XXXXXXXXXXXX` - 12 random characters, ~60 bits.
 *
 * This doubles as the bearer token for the membership lookup, so it has to be
 * unguessable, not just unique.
 */
export function generateOrderRef(): string {
  let out = "";
  for (let i = 0; i < 12; i++) out += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `DOS-${out}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

// ---------------------------------------------------------------------------
// Passwords (admin accounts)
// ---------------------------------------------------------------------------

const SCRYPT_KEYLEN = 64;

/** Stored as `scrypt$<salt-hex>$<hash-hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

// ---------------------------------------------------------------------------
// Signed values (admin session cookies)
// ---------------------------------------------------------------------------

/** Appends an HMAC so the value can be handed to a client and trusted back. */
export function sign(value: string, secret: string): string {
  return `${value}.${hmacHex(value, secret)}`;
}

/** Returns the payload if the signature holds, else `null`. */
export function unsign(signed: string, secret: string): string | null {
  const index = signed.lastIndexOf(".");
  if (index <= 0) return null;

  const value = signed.slice(0, index);
  const signature = signed.slice(index + 1);
  return safeEqual(signature, hmacHex(value, secret)) ? value : null;
}
