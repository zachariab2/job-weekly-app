import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/report/report-view";
import { requireActiveUser } from "@/lib/auth/session";
import { getOrCreateReport } from "@/lib/services/report-service";

export default async function WeeklyReportPage() {
  const user = await requireActiveUser();
  let report = null;
  try {
    report = await getOrCreateReport(user.id);
  } catch {
    // Report generation failed (e.g., OpenAI/JSearch unavailable)
  }

  return (
    <AppShell active="/report/weekly" user={user}>
      {report ? (
        <ReportView report={report} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/35">
          Report generation in progress — refresh in a moment.
        </div>
      )}
    </AppShell>
  );
}
