import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";

const steps = [
  {
    number: "01",
    title: "Tell us who you are",
    description:
      "Upload your resume and fill out a 5-minute profile: target roles, companies you admire, location, job type, and what matters most. We save everything — no repeat inputs.",
    detail: "Resume · Priorities · Location · Role type",
  },
  {
    number: "02",
    title: "Your batch drops every 3 days",
    description:
      "5 roles arrive in your dashboard, each with a reason it was picked for you, the alumni and adjacent contacts who can get you in, resume bullets rewritten for that specific company, and a ready-to-send outreach message.",
    detail: "Dashboard · Email · SMS alert",
  },
  {
    number: "03",
    title: "Execute without second-guessing",
    description:
      "Open the role, copy the outreach, download your tailored resume, and apply. Track your pipeline in the applications tab. Earn free weeks by referring classmates.",
    detail: "Apply · Track · Refer · Repeat",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="space-y-10">
      <SectionHeading
        eyebrow="HOW IT WORKS"
        title="Three steps. Real results."
        description="Every piece is designed to get you from inbox to interview — not from inbox to another tab you forget about."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.number} className="space-y-4 relative">
            <p className="text-4xl font-bold text-white/8 select-none absolute top-4 right-5">
              {step.number}
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Step {step.number}
            </p>
            <p className="text-base font-semibold text-white">{step.title}</p>
            <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
            <p className="text-xs text-white/30 pt-1 border-t border-white/5">{step.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
