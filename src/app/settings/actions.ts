"use server";

import { db, notificationPreferences } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requireActiveUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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
