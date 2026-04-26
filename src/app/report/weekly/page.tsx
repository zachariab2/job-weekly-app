import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/report/report-view";
import { requireActiveUser } from "@/lib/auth/session";
import { getLatestReport, REPORT_TTL_MS } from "@/lib/services/report-service";
import { RefreshReportButton } from "./refresh-report-button";

export default async function WeeklyReportPage() {
  const user = await requireActiveUser();
  const report = await getLatestReport(user.id);

  const isStale =
    !report ||
    !report.generatedAt ||
    report.generatedAt.getTime() < Date.now() - REPORT_TTL_MS;

  return (
    <AppShell active="/report/weekly" user={user}>
      {report ? (
        <>
          <ReportView report={report} />
          {isStale && (
            <div className="mt-4">
              <RefreshReportButton />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <p className="text-sm text-white/35">
            No report yet — generate your first one.
          </p>
          <RefreshReportButton label="Generate report" />
        </div>
      )}
    </AppShell>
  );
}
