import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireActiveUser } from "@/lib/auth/session";
import { getOrCreateReport } from "@/lib/services/report-service";
import Link from "next/link";

export default async function ResumePage() {
  const user = await requireActiveUser();
  let report = null;
  try {
    report = await getOrCreateReport(user.id);
  } catch {
    // Report generation failed — show empty state
  }
  const resumeRecommendations = report?.resumeRecommendations ?? [];

  return (
    <AppShell active="/resume" user={user}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Resume vault</p>
          <h1 className="text-3xl font-semibold text-white">Tailored resumes</h1>
        </div>
        <Button>Upload resume</Button>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{entry.company}</p>
                  <p className="text-xs text-white/50">Updated {report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "recently"}</p>
                </div>
                <Button variant="secondary" size="sm">
                  Download
                </Button>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                {bullets.map((bullet) => (
                  <p key={bullet} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                    {bullet}
                  </p>
                ))}
              </div>
              {bullets.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-white/60">
                  {bullets.map((bullet) => (
                    <span key={`${entry.company}-${bullet}`} className="rounded-full border border-white/10 px-3 py-1">
                      {bullet.split(" ").slice(0, 2).join(" ")}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
