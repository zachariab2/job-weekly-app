import { getSessionUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  const raw = process.env.OWNER_EMAILS ?? "";
  const allowlist = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return NextResponse.json({
    sessionEmail: user?.email ?? null,
    ownerEmails: allowlist,
    match: user ? allowlist.includes((user.email ?? "").toLowerCase()) : false,
  });
}
