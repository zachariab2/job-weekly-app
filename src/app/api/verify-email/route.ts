import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Invalid link.", { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.emailVerificationToken, token),
  });

  if (!user) {
    return new NextResponse("This link is invalid or has already been used.", { status: 400 });
  }

  await db.update(users)
    .set({ emailVerifiedAt: new Date(), emailVerificationToken: null })
    .where(eq(users.id, user.id));

  const appUrl = process.env.APP_URL ?? "https://getjobweekly.com";
  return NextResponse.redirect(`${appUrl}/onboarding?verified=1`);
}
