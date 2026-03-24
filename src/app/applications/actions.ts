"use server";

import { revalidatePath } from "next/cache";
import { db, applications } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";

const allStatuses = ["untouched", "in-progress", "applied", "done"] as const;
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

  if (status === "untouched") {
    if (existing) {
      await db.delete(applications).where(eq(applications.id, existing.id));
    }
  } else if (existing) {
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
