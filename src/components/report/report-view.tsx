import { Card } from "@/components/ui/card";
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
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Weekly report</p>
        <h1 className="text-3xl font-semibold text-white">{generatedLabel}</h1>
        <p className="text-sm text-white/60">Generated from your resume, profile, and live preferences.</p>
      </div>

      <Card className="space-y-6">
        <h2 className="text-xl font-semibold">Executive summary</h2>
        <p className="text-sm text-white/70">{report.summary}</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Best-fit opportunities</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {report.recommendations?.map((company) => (
            <div key={company.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div>
                <p className="text-base font-semibold">{company.company}</p>
                <p className="text-xs text-white/50">{company.role}</p>
              </div>
              <p className="text-sm text-white/70">{company.reasoning}</p>
              {company.jobUrl && (
                <a
                  href={company.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-[var(--accent)] hover:opacity-80 transition"
                >
                  View job posting ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>

      {report.resumeRecommendations && report.resumeRecommendations.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Resume tailoring</h2>
          <div className="space-y-4">
            {report.resumeRecommendations.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{entry.company}</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
                  {entry.bullets?.split("\n").filter(Boolean).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {report.networking && report.networking.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">Outreach templates</h2>
          <div className="space-y-4">
            {report.networking.map((template) => (
              <div key={template.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div>
                  <p className="text-sm font-semibold">{template.name}</p>
                  <p className="text-xs text-white/50">{template.role} · {template.company}</p>
                  {template.connectionBasis && (
                    <p className="text-xs text-white/35 mt-0.5">{template.connectionBasis}</p>
                  )}
                </div>
                {template.outreachSnippet && (
                  <p className="text-sm text-white/70 leading-relaxed">{template.outreachSnippet}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {template.contactEmail && (
                    <a
                      href={`mailto:${template.contactEmail}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      ✉ Email
                    </a>
                  )}
                  {template.contactLinkedin && (
                    <a
                      href={template.contactLinkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
