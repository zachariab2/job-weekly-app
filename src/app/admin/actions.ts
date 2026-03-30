"use server";

import { db, networkingLeads, subscriptions, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireOwner } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const contactSchema = z.object({
  reportId: z.string(),
  company: z.string(),
  name: z.string().min(1),
  role: z.string().optional().default(""),
  contactLinkedin: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  connectionBasis: z.string().optional().default(""),
  outreachSnippet: z.string().optional().default(""),
});

export async function addContactAction(formData: FormData) {
  await requireOwner();
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return;

  const d = parsed.data;
  await db.insert(networkingLeads).values({
    reportId: d.reportId,
    company: d.company,
    name: d.name,
    role: d.role || "Contact",
    connectionBasis: d.connectionBasis || "Manual contact",
    outreachSnippet: d.outreachSnippet || null,
    contactLinkedin: d.contactLinkedin || null,
    contactEmail: d.contactEmail || null,
    contactGithub: null,
  });

  revalidatePath("/admin");
}

export async function deleteContactAction(formData: FormData) {
  await requireOwner();
  const id = Number(formData.get("contactId"));
  if (!id) return;
  await db.delete(networkingLeads).where(eq(networkingLeads.id, id));
  revalidatePath("/admin");
}

export async function activateUserAction(formData: FormData) {
  await requireOwner();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;

  const existing = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) });
  const oneYear = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

  if (existing) {
    await db.update(subscriptions).set({ status: "active", currentPeriodEnd: oneYear }).where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({ userId, status: "active", currentPeriodEnd: oneYear });
  }

  revalidatePath("/admin");
}

export async function deleteUserAction(formData: FormData) {
  await requireOwner();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;

  const { reports, reportRecommendations, resumeRecommendations, profiles, jobPreferences, applications, subscriptions: subs, notificationPreferences, referralCodes } = await import("@/lib/db");

  const userReports = await db.query.reports.findMany({ where: eq(reports.userId, userId), columns: { id: true } });
  for (const r of userReports) {
    await db.delete(reportRecommendations).where(eq(reportRecommendations.reportId, r.id));
    await db.delete(resumeRecommendations).where(eq(resumeRecommendations.reportId, r.id));
    await db.delete(networkingLeads).where(eq(networkingLeads.reportId, r.id));
  }
  await db.delete(reports).where(eq(reports.userId, userId));
  await db.delete(profiles).where(eq(profiles.userId, userId));
  await db.delete(jobPreferences).where(eq(jobPreferences.userId, userId));
  await db.delete(applications).where(eq(applications.userId, userId));
  await db.delete(subs).where(eq(subs.userId, userId));
  await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  await db.delete(referralCodes).where(eq(referralCodes.ownerUserId, userId));
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin");
}
