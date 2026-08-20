/**
 * Creates or updates an admin account.
 *
 *   node scripts/create-admin.mjs you@example.com "a long passphrase" "Your Name"
 *
 * Deliberately a script and not a route: there is no public signup for the
 * admin panel, and there should not be one. Run it locally with DATABASE_URL
 * pointing at the environment you want the account in.
 *
 * Plain .mjs so it runs under `node` with no build step; it duplicates the
 * scrypt format from src/lib/crypto.ts, which must not change independently.
 */

import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { neon, neonConfig } from "@neondatabase/serverless";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  loadEnvFile();

  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.mjs <email> <password> [name]');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Put it in .env.local or export it.");
    process.exit(1);
  }

  // Mirror src/lib/db.ts: against the local Docker stack the driver has to be
  // pointed at the HTTP proxy, because plain Postgres does not speak Neon's
  // HTTP protocol. Unset in production, where it talks to Neon directly.
  if (process.env.NEON_HTTP_PROXY) {
    neonConfig.fetchEndpoint = process.env.NEON_HTTP_PROXY;
    neonConfig.useSecureWebSocket = false;
    neonConfig.poolQueryViaFetch = true;
  }

  const sql = neon(process.env.DATABASE_URL);
  const normalized = email.trim().toLowerCase();

  // Upsert, so re-running this is how you reset a forgotten password.
  const rows = await sql`
    insert into admin_users (email, password_hash, name)
    values (${normalized}, ${hashPassword(password)}, ${name ?? null})
    on conflict (email) do update
      set password_hash = excluded.password_hash,
          name          = coalesce(excluded.name, admin_users.name),
          is_active     = true
    returning id, email, created_at
  `;

  // Any existing sessions belonged to the old password.
  await sql`
    update admin_sessions set revoked_at = now()
     where admin_user_id = ${rows[0].id} and revoked_at is null
  `;

  console.log(`Admin ready: ${rows[0].email} (${rows[0].id})`);
  console.log("Existing sessions for this account have been revoked.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
