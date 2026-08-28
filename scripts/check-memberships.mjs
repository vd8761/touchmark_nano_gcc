import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";

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
loadEnvFile();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const result = await sql`update memberships set welcome_email_sent_at = now() where welcome_email_sent_at is null returning id`;
  console.log("Cleared pending receipts for:", result);
}

main().catch(console.error);
