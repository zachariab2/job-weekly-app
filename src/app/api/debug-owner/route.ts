import { getSessionUser } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  const raw = process.env.OWNER_EMAILS ?? "";
  const allowlist = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const allUsers = await db.query.users.findMany({
    columns: { email: true, firstName: true, lastName: true },
  });

  return NextResponse.json({
    sessionEmail: user?.email ?? null,
    ownerEmails: allowlist,
    match: user ? allowlist.includes((user.email ?? "").toLowerCase()) : false,
    registeredEmails: allUsers.map((u) => u.email),
  });
}

export async function POST() {
  await db
    .update(users)
    .set({ email: "zackybouzy@gmail.com" })
    .where(eq(users.email, "zackbouzy@gmail.com"));

  return NextResponse.json({ ok: true, message: "Email updated to zackybouzy@gmail.com" });
}
