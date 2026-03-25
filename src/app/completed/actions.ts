"use server";

import { revalidatePath } from "next/cache";
import { db, applications } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const user = await requireActiveUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));

  revalidatePath("/completed");
}
