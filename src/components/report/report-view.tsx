import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportWithRelations } from "@/lib/services/report-service";

export function ReportView({ report }: { report: ReportWithRelations }) {
  const generatedLabel = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Pending";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Weekly report</p>
          <h1 className="text-3xl font-semibold text-white">{generatedLabel}</h1>
          <p className="text-sm text-white/60">Generated from your resume, profile, and live preferences.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <a href={`/api/report/${report.id}/pdf`} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          </Button>
          <Button variant="secondary">Share summary</Button>
        </div>
      </div>
      <Card className="space-y-6">
        <h2 className="text-xl font-semibold">Executive summary</h2>
        <p className="text-sm text-white/70">{report.summary}</p>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Best-fit opportunities</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.recommendations?.map((company) => (
            <div key={company.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">{company.company}</p>
                  <p className="text-xs text-white/50">{company.role}</p>
                </div>
                <Button variant="secondary">Save</Button>
              </div>
              <p className="mt-3 text-sm text-white/70">{company.reasoning}</p>
              <p className="mt-3 text-xs text-white/50">Alumni: {company.alumni}</p>
              <p className="text-xs text-white/50">Referral path: {company.referralPath}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Resume tailoring</h2>
        <div className="space-y-4">
          {report.resumeRecommendations?.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">{entry.company}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
                {entry.bullets?.split("\n").map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Outreach templates</h2>
        <div className="space-y-4">
          {report.networking?.map((template) => (
            <div key={template.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{template.company}</p>
                  <p className="text-xs text-white/50">{template.name}</p>
                </div>
                <Button variant="ghost" className="text-[var(--accent)]">
                  Copy template
                </Button>
              </div>
              <p className="mt-3 text-sm text-white/70">{template.outreachSnippet}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
