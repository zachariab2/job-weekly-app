import { SectionHeading } from "../ui/section-heading";
import { FadeIn } from "./fade-in";

const rows = [
  {
    feature: "Job matching",
    others: "Keyword search — you do the work",
    jobWeekly: "5 roles curated to YOUR resume",
  },
  {
    feature: "Contacts",
    others: "Cold LinkedIn DMs, no context",
    jobWeekly: "Alumni & recruiter at each company",
  },
  {
    feature: "Outreach",
    others: "You write from scratch every time",
    jobWeekly: "Message written and ready to send",
  },
  {
    feature: "Resume",
    others: "One generic version for every job",
    jobWeekly: "Bullets rewritten per company",
  },
  {
    feature: "Volume",
    others: "50+ random applications a week",
    jobWeekly: "5 targeted, high-probability moves",
  },
  {
    feature: "Refresh",
    others: "Manual — whenever you remember",
    jobWeekly: "Every 3 days, automatically",
  },
  {
    feature: "Support",
    others: "None / chatbot",
    jobWeekly: "Human reply within 24h",
  },
];

export function Comparison() {
  return (
    <section id="compare" className="space-y-10">
      <FadeIn>
        <SectionHeading
          eyebrow="WHY JOBWEEKLY"
          title="Most platforms give you a list. We give you a plan."
          description="InternInsider gives you recruiter emails. LinkedIn gives you listings. Neither tells you who to contact, what to say, or how to tailor your resume. We do all three."
        />
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/30 w-[22%]">
                  Feature
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/30 w-[39%]">
                  Everyone else
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[var(--accent)] w-[39%]">
                  JobWeekly
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i < rows.length - 1 ? "border-b border-white/5" : ""}
                >
                  <td className="px-5 py-4 font-semibold text-white/70">{row.feature}</td>
                  <td className="px-5 py-4 text-white/35">{row.others}</td>
                  <td className="px-5 py-4 font-medium text-white/90 bg-[var(--accent-strong)]/5">
                    <span className="flex items-center gap-2">
                      <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent-strong)]" />
                      {row.jobWeekly}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeIn>
    </section>
  );
}
