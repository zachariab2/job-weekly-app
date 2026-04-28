import { mockWeeklyReport } from "@/data/mock-report";
import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

export function ReportPreview() {
  return (
    <section id="report" className="space-y-10">
      <SectionHeading
        eyebrow="SAMPLE REPORT"
        title="This is what lands in your dashboard"
        description="Every 3 days: 10 curated roles, the alumni paths to get there, outreach templates written for you, and resume bullets rewritten per company."
      />

      {/* Highlights bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        {mockWeeklyReport.highlights.map((h) => (
          <div key={h} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[var(--accent-strong)]" />
            <p className="text-sm text-white/70">{h}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">Sample batch · {mockWeeklyReport.generatedAt}</p>
              <p className="text-base font-semibold text-white mt-0.5">{mockWeeklyReport.summary}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mockWeeklyReport.companies.map((company) => (
              <div key={company.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-white">{company.name}</p>
                  <p className="text-xs text-white/60">{company.role}</p>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{company.reason}</p>
                <div className="pt-1 flex flex-wrap gap-1">
                  {company.resumeFocus.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-[var(--accent)]">{company.alumni} · {company.referralStatus}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-white/40">This is real output — your report is built from your actual profile and resume.</p>
            <Button size="sm" asChild>
              <Link href="/signup">Get mine →</Link>
            </Button>
          </div>
        </Card>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/30 px-1">Outreach templates included</p>
          {mockWeeklyReport.outreachTemplates.map((template) => (
            <Card key={template.company} className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">{template.company}</p>
                <p className="text-xs text-white/50">{template.contact}</p>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">"{template.snippet}…"</p>
              <p className="text-xs text-[var(--accent)]">Personalized for your background →</p>
            </Card>
          ))}
          <Card className="border-dashed border-white/15 bg-transparent text-center space-y-3 py-6">
            <p className="text-sm text-white/50">Your real report includes resume rewrites, Slack/email contacts, and more.</p>
            <Button asChild>
              <Link href="/signup">Join now</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
