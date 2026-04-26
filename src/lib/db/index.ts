import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { join } from "node:path";
import * as schema from "./schema";

// Force HTTP transport in production: replace `libsql://` with `https://`.
// WebSocket transport can silently die on idle Vercel serverless instances.
const rawUrl = process.env.TURSO_DATABASE_URL ?? `file:${join(process.cwd(), "data", "main.sqlite")}`;
const url = rawUrl.startsWith("libsql://") ? rawUrl.replace("libsql://", "https://") : rawUrl;

let client: ReturnType<typeof createClient>;
try {
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() });
} catch (err) {
  console.error("[db] createClient failed at module load:", err instanceof Error ? err.message : String(err), "url:", url.slice(0, 40));
  // Provide a stub so the module doesn't crash — queries will throw at call time
  client = createClient({ url: "file::memory:", authToken: undefined });
}

export const db = drizzle(client, { schema });
export * from "./schema";

// Auto-migrate: add resume_text column if it doesn't exist yet
client.execute("ALTER TABLE profiles ADD COLUMN resume_text text").catch(() => {});

// Auto-migrate: add email verification columns to users if they don't exist yet
client.execute("ALTER TABLE users ADD COLUMN email_verified_at INTEGER").catch(() => {});
client.execute("ALTER TABLE users ADD COLUMN email_verification_token TEXT").catch(() => {});

// Auto-migrate: create manual_contacts table if it doesn't exist yet
client.execute(`
  CREATE TABLE IF NOT EXISTS manual_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_linkedin TEXT,
    connection_basis TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  )
`).catch(() => {});
