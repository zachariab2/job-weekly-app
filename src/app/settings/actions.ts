"use server";

import { db, notificationPreferences, jobPreferences } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireActiveUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function updateJobPrefsAction(formData: FormData) {
  const user = await requireActiveUser();

  const targetRoles = (formData.get("targetRoles") as string | null)?.trim() || "";
  const jobTypes = (formData.get("jobTypes") as string | null)?.trim() || "";
  const industries = (formData.get("industries") as string | null)?.trim() || "";
  const locations = (formData.get("locations") as string | null)?.trim() || "";
  const remotePreference = (formData.get("remotePreference") as string | null)?.trim() || "";
  const dreamCompanies = (formData.get("dreamCompanies") as string | null)?.trim() || "";

  const existing = await db.query.jobPreferences.findFirst({
    where: eq(jobPreferences.userId, user.id),
  });

  if (existing) {
    await db.update(jobPreferences)
      .set({ targetRoles, jobTypes, industries, locations, remotePreference, dreamCompanies })
      .where(eq(jobPreferences.userId, user.id));
  } else {
    await db.insert(jobPreferences).values({
      userId: user.id, targetRoles, jobTypes, industries, locations, remotePreference, dreamCompanies,
    });
  }

  revalidatePath("/settings");
}

export async function updateNotificationPrefsAction(formData: FormData) {
  const user = await requireActiveUser();

  const emailEnabled = formData.get("emailEnabled") === "on";
  const smsEnabled = formData.get("smsEnabled") === "on";
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, user.id),
  });

  if (existing) {
    await db.update(notificationPreferences)
      .set({ emailEnabled, smsEnabled, phone })
      .where(eq(notificationPreferences.userId, user.id));
  } else {
    await db.insert(notificationPreferences).values({
      userId: user.id,
      emailEnabled,
      smsEnabled,
      phone,
    });
  }

  revalidatePath("/settings");
}
