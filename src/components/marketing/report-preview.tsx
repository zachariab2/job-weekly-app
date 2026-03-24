import { mockWeeklyReport } from "@/data/mock-report";
import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function ReportPreview() {
  return (
    <section id="report" className="space-y-10">
      <SectionHeading
        eyebrow="WEEKLY REPORT"
        title="Investor-demo quality dashboards"
        description="Every digest is structured for action: why each role matters, who can vouch for you, and how to tailor your resume and outreach."
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">Latest drop</p>
              <p className="text-xl font-semibold text-white">{mockWeeklyReport.generatedAt}</p>
            </div>
            <Button variant="secondary">Download PDF</Button>
          </div>
          <p className="text-sm text-white/70">{mockWeeklyReport.summary}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {mockWeeklyReport.companies.map((company) => (
              <div key={company.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{company.name}</p>
                <p className="text-xs text-white/60">{company.role}</p>
                <p className="mt-3 text-xs text-white/60">{company.reason}</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          {mockWeeklyReport.outreachTemplates.map((template) => (
            <Card key={template.company} className="space-y-3">
              <div>
                <p className="text-sm font-semibold">{template.company}</p>
                <p className="text-xs text-white/50">{template.contact}</p>
              </div>
              <p className="text-sm text-white/70">{template.snippet}</p>
              <Button variant="ghost" className="justify-start px-0 text-[var(--accent)]">
                Copy outreach draft →
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
