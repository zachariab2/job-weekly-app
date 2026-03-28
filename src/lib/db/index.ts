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
