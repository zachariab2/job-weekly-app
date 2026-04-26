"use server";

import { requireActiveUser } from "@/lib/auth/session";
import { generateReportForUser } from "@/lib/services/report-service";
import { revalidatePath } from "next/cache";

export async function refreshReportAction(): Promise<{ error?: string }> {
  const user = await requireActiveUser();
  try {
    await generateReportForUser(user.id);
    revalidatePath("/report/weekly");
    return {};
  } catch (err) {
    console.error("[refreshReportAction] failed:", err instanceof Error ? err.message : String(err));
    return { error: "Something went wrong generating your report. Please try again." };
  }
}
