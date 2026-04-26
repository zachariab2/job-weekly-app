import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveUser } from "@/lib/auth/session";
import { getLatestReport } from "@/lib/services/report-service";
import Link from "next/link";

export default async function ResumePage() {
  const user = await requireActiveUser();
  const report = await getLatestReport(user.id);
  const resumeRecommendations = report?.resumeRecommendations ?? [];

  return (
    <AppShell active="/resume" user={user}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resume vault</p>
          <h1 className="text-3xl font-semibold text-white">Resume tips</h1>
          <p className="text-sm text-white/50 mt-1">What to highlight per company — use these when tailoring on the Applications page.</p>
        </div>
        <Button asChild><a href="/api/resume/download">Download my resume</a></Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {resumeRecommendations.length === 0 && (
          <Card className="space-y-3">
            <p className="text-base font-semibold text-white">No tailored resumes yet</p>
            <p className="text-sm text-white/60">
              Finish onboarding and add a few applications. We automatically surface resume keyword focuses per role once a weekly report is generated.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/onboarding">Finish onboarding</Link>
            </Button>
          </Card>
        )}
        {resumeRecommendations.map((entry) => {
          const bullets = entry.bullets?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
          return (
            <Card key={`${entry.reportId}-${entry.company}`} className="space-y-4">
              <div>
                <p className="text-base font-semibold text-white">{entry.company}</p>
                <p className="text-xs text-white/50">Updated {report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "recently"}</p>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                {bullets.map((bullet) => (
                  <p key={bullet} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                    {bullet}
                  </p>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
