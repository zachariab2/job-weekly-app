import { AppShell } from "@/components/layout/app-shell";
import { ReportView } from "@/components/report/report-view";
import { requireActiveUser } from "@/lib/auth/session";
import { getOrCreateReport } from "@/lib/services/report-service";

export default async function WeeklyReportPage() {
  const user = await requireActiveUser();
  const report = await getOrCreateReport(user.id);

  return (
    <AppShell active="/report/weekly" user={user}>
      <ReportView report={report} />
    </AppShell>
  );
}
