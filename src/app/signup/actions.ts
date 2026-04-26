"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, users, subscriptions, referralCodes } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name required").transform((v) => v.trim()),
  lastName: z.string().min(1, "Last name required").transform((v) => v.trim()),
  email: z.string().email("Valid email required").transform((v) => v.trim().toLowerCase()),
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

  try {
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

    // Generate and store verification token
    const verifyToken = randomUUID();
    await db.update(users).set({ emailVerificationToken: verifyToken }).where(eq(users.id, userId));

    // Send verification email (only if Resend is configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        const appUrl = process.env.APP_URL ?? "https://getjobweekly.com";
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "JobWeekly <no-reply@getjobweekly.com>",
          to: email,
          subject: "Confirm your JobWeekly account",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 12px;">
              <h2 style="margin: 0 0 8px; font-size: 20px;">Welcome to JobWeekly, ${firstName}.</h2>
              <p style="color: #888; margin: 0 0 24px; font-size: 14px;">Click below to confirm your email and start your job search.</p>
              <a href="${appUrl}/api/verify-email?token=${verifyToken}" style="display: inline-block; background: #adfa1d; color: #000; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Confirm email</a>
              <p style="color: #555; margin: 24px 0 0; font-size: 12px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[signup] Failed to send verification email:", err instanceof Error ? err.message : String(err));
        // Don't block signup if email fails — user can still proceed
      }
    }
  } catch (error) {
    console.error("[signupAction] failed:", error);

    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("users.email")) {
      return { error: "An account already exists with that email." };
    }

    return { error: "Signup failed. Please try again in a few seconds." };
  }

  redirect("/onboarding?welcome=1");
}
