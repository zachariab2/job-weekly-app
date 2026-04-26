"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users, profiles, jobPreferences, notificationPreferences } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { generateReportForUser, getAllActiveJobsForUser } from "@/lib/services/report-service";
import { notifyFreshBatchIfNeeded } from "@/lib/notifications";
import { logAdminEvent } from "@/lib/admin-audit";

export async function saveClientProfileAction(formData: FormData) {
  const owner = await requireOwner();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const firstName = String(formData.get("firstName") ?? "");
  const lastName = String(formData.get("lastName") ?? "");
  const university = String(formData.get("university") ?? "");
  const major = String(formData.get("major") ?? "");
  const graduation = String(formData.get("graduation") ?? "");
  const linkedin = String(formData.get("linkedin") ?? "");
  const github = String(formData.get("github") ?? "");

  await db.update(users).set({ firstName, lastName }).where(eq(users.id, userId));

  const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  if (existingProfile) {
    await db
      .update(profiles)
      .set({ university, major, graduation, linkedin, github, updatedAt: new Date() })
      .where(eq(profiles.id, existingProfile.id));
  } else {
    await db.insert(profiles).values({ userId, university, major, graduation, linkedin, github });
  }

  await logAdminEvent({
    ownerEmail: owner.email,
    action: "save_client_profile",
    targetUserId: userId,
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function saveClientJobPrefsAction(formData: FormData) {
  const owner = await requireOwner();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const targetRoles = String(formData.get("targetRoles") ?? "");
  const jobTypes = String(formData.get("jobTypes") ?? "");
  const industries = String(formData.get("industries") ?? "");
  const locations = String(formData.get("locations") ?? "");
  const remotePreference = String(formData.get("remotePreference") ?? "");
  const dreamCompanies = String(formData.get("dreamCompanies") ?? "");

  const existing = await db.query.jobPreferences.findFirst({ where: eq(jobPreferences.userId, userId) });
  if (existing) {
    await db
      .update(jobPreferences)
      .set({ targetRoles, jobTypes, industries, locations, remotePreference, dreamCompanies })
      .where(eq(jobPreferences.id, existing.id));
  } else {
    await db.insert(jobPreferences).values({ userId, targetRoles, jobTypes, industries, locations, remotePreference, dreamCompanies });
  }

  await logAdminEvent({
    ownerEmail: owner.email,
    action: "save_client_job_prefs",
    targetUserId: userId,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function saveClientNotifAction(formData: FormData) {
  const owner = await requireOwner();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const emailEnabled = String(formData.get("emailEnabled") ?? "false") === "true";
  const smsEnabled = String(formData.get("smsEnabled") ?? "false") === "true";
  const phone = String(formData.get("phone") ?? "") || null;
  const notificationThreshold = Number(formData.get("notificationThreshold") ?? "3") || 3;

  const existing = await db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, userId) });
  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ emailEnabled, smsEnabled, phone, notificationThreshold })
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db.insert(notificationPreferences).values({ userId, emailEnabled, smsEnabled, phone, notificationThreshold });
  }

  await logAdminEvent({
    ownerEmail: owner.email,
    action: "save_client_notifications",
    targetUserId: userId,
  });

  revalidatePath(`/admin/users/${userId}`);
}

export async function refreshClientReportAction(formData: FormData) {
  const owner = await requireOwner();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const beforeCount = (await getAllActiveJobsForUser(userId)).length;
  await generateReportForUser(userId);
  const afterCount = (await getAllActiveJobsForUser(userId)).length;
  const newJobs = Math.max(afterCount - beforeCount, 0);

  const notified = await notifyFreshBatchIfNeeded({
    userId,
    newJobCount: newJobs,
    totalActiveJobs: afterCount,
  });

  await logAdminEvent({
    ownerEmail: owner.email,
    action: "refresh_client_report",
    targetUserId: userId,
    details: {
      newJobs,
      totalActiveJobs: afterCount,
      emailSent: notified.emailSent,
      smsSent: notified.smsSent,
      attemptedNotification: notified.attempted,
    },
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/applications");
}
