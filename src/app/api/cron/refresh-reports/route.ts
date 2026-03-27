import { NextRequest, NextResponse } from "next/server";
import { db, subscriptions, reports } from "@/lib/db";
import { inArray, eq, desc } from "drizzle-orm";
import { generateReportForUser } from "@/lib/services/report-service";
import { REPORT_TTL_MS } from "@/lib/services/report-service";
import { notifyFreshBatchIfNeeded } from "@/lib/notifications";

// Give the cron job plenty of time — it runs sequentially per user
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron requests
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users with an active or trialing subscription
  const activeSubs = await db.query.subscriptions.findMany({
    where: inArray(subscriptions.status, ["active", "trialing"]),
  });

  const results: {
    userId: string;
    status: "refreshed" | "skipped" | "error";
    newJobs?: number;
    notified?: { attempted: boolean; emailSent: boolean; smsSent: boolean; reason?: string };
  }[] = [];

  for (const sub of activeSubs) {
    try {
      // Check when their last report was generated
      const latest = await db.query.reports.findFirst({
        where: eq(reports.userId, sub.userId),
        orderBy: desc(reports.generatedAt),
      });

      const isStale =
        !latest ||
        !latest.generatedAt ||
        latest.generatedAt.getTime() < Date.now() - REPORT_TTL_MS;

      if (!isStale) {
        results.push({ userId: sub.userId, status: "skipped" });
        continue;
      }

      const report = await generateReportForUser(sub.userId);
      const newJobs = report.recommendations?.length ?? 0;

      const notified = await notifyFreshBatchIfNeeded({
        userId: sub.userId,
        newJobCount: newJobs,
        totalActiveJobs: newJobs,
      });

      results.push({ userId: sub.userId, status: "refreshed", newJobs, notified });
    } catch (err) {
      console.error(`[cron] failed for user ${sub.userId}:`, err instanceof Error ? err.message : String(err));
      results.push({ userId: sub.userId, status: "error" });
    }
  }

  const summary = {
    totalUsers: activeSubs.length,
    refreshed: results.filter((r) => r.status === "refreshed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    emailsSent: results.filter((r) => r.notified?.emailSent).length,
    smsSent: results.filter((r) => r.notified?.smsSent).length,
  };

  console.log("[cron/refresh-reports]", JSON.stringify({ summary, results }));
  return NextResponse.json({ ok: true, summary, results });
}
