"use server";

import { z } from "zod";
import { db, users, profiles, jobPreferences, notificationPreferences, subscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getStripeClient } from "@/lib/payments/stripe";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

type ParsedResumeFields = {
  firstName?: string;
  lastName?: string;
  university?: string;
  major?: string;
  graduation?: string;
  linkedin?: string;
  github?: string;
};

export async function parseResumeFieldsAction(formData: FormData): Promise<{ fields: ParsedResumeFields }> {
  const file = formData.get("resume") as File | null;
  if (!file || file.size === 0) return { fields: {} };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.slice(0, 3000) ?? "";
    if (!text) return { fields: {} };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { fields: {} };

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Extract the following fields from this resume. Return valid JSON only, no explanation. Use null for missing fields.

Fields: firstName, lastName, university, major, graduation (e.g. "May 2026"), linkedin (full URL), github (username only, no URL)

Resume:
${text}`,
      }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const json = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(json);

    return {
      fields: {
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        university: data.university || undefined,
        major: data.major || undefined,
        graduation: data.graduation || undefined,
        linkedin: data.linkedin || undefined,
        github: data.github || undefined,
      },
    };
  } catch {
    return { fields: {} };
  }
}

export async function uploadResumeAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("resume") as File | null;
  if (!file || file.size === 0) return { status: "error" as const, message: "No file provided." };
  if (file.size > 5 * 1024 * 1024) return { status: "error" as const, message: "File must be under 5MB." };

  // Read buffer first — file stream can only be consumed once
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let resumeUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Production: store in Vercel Blob
    const blob = await put(`resumes/${user.id}.pdf`, fileBuffer, { access: "private", allowOverwrite: true, contentType: "application/pdf" });
    resumeUrl = blob.url;
  } else {
    // Development: store locally
    const dir = path.join(process.cwd(), "data", "resumes");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${user.id}.pdf`);
    await writeFile(filePath, fileBuffer);
    resumeUrl = filePath;
  }

  // Parse text from buffer (already read above)
  let resumeText: string | null = null;
  try {
    const pdfParseModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const parsed = await pdfParse(fileBuffer);
    resumeText = parsed.text?.trim() || null;
  } catch {
    // Non-fatal — text extraction failed, tailored resumes won't work but upload succeeds
  }

  const existing = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  if (existing) {
    await db.update(profiles).set({ resumeUrl, resumeText, updatedAt: new Date() }).where(eq(profiles.id, existing.id));
  } else {
    await db.insert(profiles).values({ userId: user.id, resumeUrl, resumeText });
  }

  return { status: "ok" as const };
}

const onboardingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  university: z.string().optional().default(""),
  major: z.string().optional().default(""),
  graduation: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  targetRole: z.string().optional().default(""),
  jobTypes: z.string().optional().default(""),
  industries: z.string().optional().default(""),
  locations: z.string().optional().default(""),
  relocation: z.string().optional().default(""),
  dreamCompanies: z.string().optional().default(""),
  notificationThreshold: z.string().optional().default("3"),
  emailNotif: z.string().optional().default("false"),
  smsNotif: z.string().optional().default("false"),
  phone: z.string().optional().default(""),
});

async function upsertProfile(userId: string, data: Record<string, string>) {
  const existing = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  if (existing) {
    await db.update(profiles).set({
      university: data.university,
      major: data.major,
      graduation: data.graduation,
      linkedin: data.linkedin,
      github: data.github,
      updatedAt: new Date(),
    }).where(eq(profiles.id, existing.id));
  } else {
    await db.insert(profiles).values({
      userId,
      university: data.university,
      major: data.major,
      graduation: data.graduation,
      linkedin: data.linkedin,
      github: data.github,
    });
  }
}

async function upsertJobPreferences(userId: string, data: Record<string, string>) {
  const existing = await db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, userId) });
  if (existing) {
    await db.update(jobPreferences).set({
      targetRoles: data.targetRole,
      industries: data.industries,
      jobTypes: data.jobTypes,
      locations: data.locations,
      remotePreference: data.relocation,
      dreamCompanies: data.dreamCompanies,
    }).where(eq(jobPreferences.id, existing.id));
  } else {
    await db.insert(jobPreferences).values({
      userId,
      targetRoles: data.targetRole,
      industries: data.industries,
      jobTypes: data.jobTypes,
      locations: data.locations,
      remotePreference: data.relocation,
      dreamCompanies: data.dreamCompanies,
    });
  }
}

async function upsertNotifPrefs(userId: string, data: Record<string, string>) {
  const threshold = data.notificationThreshold === "Never" ? 999 : Number(data.notificationThreshold) || 3;
  const existing = await db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, userId) });
  if (existing) {
    await db.update(notificationPreferences).set({
      emailEnabled: data.emailNotif === "true",
      smsEnabled: data.smsNotif === "true",
      phone: data.phone || null,
      notificationThreshold: threshold,
    }).where(eq(notificationPreferences.id, existing.id));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      emailEnabled: data.emailNotif === "true",
      smsEnabled: data.smsNotif === "true",
      phone: data.phone || null,
      notificationThreshold: threshold,
    });
  }
}

export async function completeOnboarding(payload: Record<string, string | undefined>) {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(payload);

  if (!parsed.success) {
    return { status: "error" as const, message: "Please fill in your first and last name." };
  }

  const data = parsed.data as Record<string, string>;

  // Require resume upload before proceeding
  const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  if (!existingProfile?.resumeUrl) {
    return { status: "error" as const, message: "Please upload your resume before continuing." };
  }

  await db.update(users)
    .set({ firstName: data.firstName, lastName: data.lastName })
    .where(eq(users.id, user.id));

  await upsertProfile(user.id, data);
  await upsertJobPreferences(user.id, data);
  await upsertNotifPrefs(user.id, data);

  // Already subscribed — go straight to app
  const existing = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) });
  if (existing?.status === "active") redirect("/applications");

  const stripe = getStripeClient();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const weeklyPriceId = process.env.STRIPE_WEEKLY_PRICE_ID;

  let checkoutUrl: string;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
      line_items: weeklyPriceId
        ? [{ quantity: 1, price: weeklyPriceId }]
        : [{
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: 999,
              recurring: { interval: "week" },
              product_data: {
                name: "JobWeekly Weekly Membership",
                description: "Premium job search operating system",
              },
            },
          }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/onboarding`,
    });

    if (!session.url) return { status: "error" as const, message: "Could not start checkout. Try again." };

    checkoutUrl = session.url;
  } catch (err) {
    console.error("[completeOnboarding] Stripe checkout error:", err instanceof Error ? err.message : String(err));
    return { status: "error" as const, message: "Could not start checkout. Check Stripe price/env config and try again." };
  }

  redirect(checkoutUrl);
}
