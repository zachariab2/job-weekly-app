import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/report/report-view";
import { requireActiveUser } from "@/lib/auth/session";
import { getLatestReport, REPORT_TTL_MS } from "@/lib/services/report-service";
import { refreshReportAction } from "./actions";

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
            <form action={refreshReportAction} className="mt-4">
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition"
              >
                Refresh report
              </button>
            </form>
          )}
        </>
      ) : (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
          <p className="text-sm text-white/35">
            No report yet — generate your first one.
          </p>
          <form action={refreshReportAction}>
            <button
              type="submit"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Generate report
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
