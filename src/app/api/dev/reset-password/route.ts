import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { hashPassword } from "@/lib/auth/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "missing email or password" }, { status: 400 });
  }

  const hash = hashPassword(password);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, email));

  return NextResponse.json({ ok: true });
}
