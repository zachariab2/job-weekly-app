"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, users, subscriptions, referralCodes } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Use at least 8 characters"),
  referralCode: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim().toUpperCase() : undefined)),
});

export type SignupResult = { error?: string };

export async function signupAction(_: SignupResult, formData: FormData): Promise<SignupResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(raw);

  if (!parsed.success) {
    const message = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: message ?? "Check the highlighted fields." };
  }

  const { email, password, firstName, lastName, referralCode } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: "An account already exists with that email." };
  }

  let referralRecord: (typeof referralCodes.$inferSelect) | null = null;
  if (referralCode) {
    referralRecord = await db.query.referralCodes.findFirst({ where: eq(referralCodes.code, referralCode) }) ?? null;
    if (!referralRecord) {
      return { error: "Referral code not found." };
    }
    if (referralRecord.redeemedByUserId) {
      return { error: "That referral code has already been used." };
    }
    const ownerSub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, referralRecord.ownerUserId) });
    if (!ownerSub || ownerSub.status !== "active") {
      return { error: "Referral codes activate only for paying members." };
    }
  }

  const userId = randomUUID();
  const passwordHash = hashPassword(password);

  await db.insert(users).values({ id: userId, email, passwordHash, firstName, lastName });

  await db.insert(subscriptions).values({
    userId,
    status: "pending",
    price: 9.99,
    bonusWeeksApplied: 0,
  });

  if (referralRecord) {
    await db
      .update(referralCodes)
      .set({ redeemedByUserId: userId, redeemedAt: null })
      .where(eq(referralCodes.code, referralRecord.code));
  }

  await createSession(userId);
  redirect("/onboarding");
}
