"use server";

import { revalidatePath } from "next/cache";
import { db, applications } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth/session";
import { generateReportForUser } from "@/lib/services/report-service";
import { and, eq } from "drizzle-orm";

export async function generateReportAction(): Promise<{ error?: string }> {
  const user = await requireActiveUser();
  try {
    await generateReportForUser(user.id);
    revalidatePath("/applications");
    return {};
  } catch (err) {
    console.error("[generateReportAction] failed:", err instanceof Error ? err.message : String(err));
    return { error: "Something went wrong generating your report. Please try again." };
  }
}

const allStatuses = ["untouched", "in-progress", "applied", "done", "dismissed"] as const;
type Status = (typeof allStatuses)[number];

export async function setApplicationStatusAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const company = String(formData.get("company"));
  const role = String(formData.get("role"));
  const status = String(formData.get("status")) as Status;

  if (!allStatuses.includes(status)) return;

  const existing = await db.query.applications.findFirst({
    where: and(
      eq(applications.userId, user.id),
      eq(applications.company, company),
      eq(applications.role, role),
    ),
  });

  if (existing) {
    await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, existing.id));
  } else {
    await db.insert(applications).values({
      userId: user.id,
      company,
      role,
      status,
      appliedDate: status === "applied" ? new Date().toISOString().slice(0, 10) : null,
    });
  }

  revalidatePath("/applications");
  revalidatePath("/completed");
}
