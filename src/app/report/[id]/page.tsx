import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/report/report-view";
import { requireActiveUser } from "@/lib/auth/session";
import { db, reports } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireActiveUser();
  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, id), eq(reports.userId, user.id)),
    with: {
      recommendations: true,
      networking: true,
      resumeRecommendations: true,
    },
  });

  if (!report) {
    redirect("/report/weekly");
  }

  return (
    <AppShell active="/report/weekly" user={user}>
      <ReportView report={report} />
    </AppShell>
  );
}
