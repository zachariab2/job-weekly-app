import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { join } from "node:path";
import * as schema from "./schema";

// Force HTTP transport in production: replace `libsql://` with `https://`.
// WebSocket transport can silently die on idle Vercel serverless instances,
// causing every DB query to throw on the next warm request. HTTP is stateless
// and reliable for serverless.
const rawUrl = process.env.TURSO_DATABASE_URL ?? `file:${join(process.cwd(), "data", "main.sqlite")}`;
const url = rawUrl.startsWith("libsql://") ? rawUrl.replace("libsql://", "https://") : rawUrl;

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export * from "./schema";
