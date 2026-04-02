import { SectionHeading } from "../ui/section-heading";

const rows = [
  {
    feature: "Job matching",
    massApply: "Search yourself",
    jobBoards: "Keyword filter",
    jobWeekly: "Curated 5 roles from your profile",
  },
  {
    feature: "Referral paths",
    massApply: "Cold LinkedIn",
    jobBoards: "None",
    jobWeekly: "Alumni + adjacent contacts per role",
  },
  {
    feature: "Resume",
    massApply: "One version for all",
    jobBoards: "Generic optimization tips",
    jobWeekly: "Bullets rewritten per company",
  },
  {
    feature: "Outreach",
    massApply: "You write from scratch",
    jobBoards: "None",
    jobWeekly: "Template ready to send",
  },
  {
    feature: "Refresh cycle",
    massApply: "Manual, whenever",
    jobBoards: "Real-time (overwhelming)",
    jobWeekly: "Every 3 days — focused, not noisy",
  },
  {
    feature: "Volume",
    massApply: "50+ generic apps/week",
    jobBoards: "High",
    jobWeekly: "5 targeted, high-probability moves",
  },
  {
    feature: "Support",
    massApply: "None",
    jobBoards: "Docs / chatbot",
    jobWeekly: "Human reply within 24h",
  },
];

export function Comparison() {
  return (
    <section id="compare" className="space-y-10">
      <SectionHeading
        eyebrow="WHY JOBWEEKLY"
        title="Quality over volume, every time"
        description="Mass-applying is a lottery. JobWeekly replaces 50 random shots with 5 that are researched, personalized, and backed by a real referral path."
      />
      <div className="overflow-x-auto rounded-3xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/30 w-[22%]">
                Feature
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/30 w-[26%]">
                Mass applying
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/30 w-[26%]">
                Generic job boards
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-[var(--accent)] w-[26%]">
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
                <td className="px-5 py-4 text-white/40">{row.massApply}</td>
                <td className="px-5 py-4 text-white/40">{row.jobBoards}</td>
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
    </section>
  );
}
