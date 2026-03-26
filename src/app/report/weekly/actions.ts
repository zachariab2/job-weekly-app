"use server";

import { requireActiveUser } from "@/lib/auth/session";
import { generateReportForUser } from "@/lib/services/report-service";
import { revalidatePath } from "next/cache";

export async function refreshReportAction() {
  const user = await requireActiveUser();
  try {
    await generateReportForUser(user.id);
  } catch (err) {
    console.error("[refreshReportAction] failed:", err instanceof Error ? err.message : String(err));
  }
  revalidatePath("/report/weekly");
}
