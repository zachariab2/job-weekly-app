import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { FadeIn } from "./fade-in";

const steps = [
  {
    number: "01",
    title: "Tell us who you are",
    description:
      "Upload your resume and fill out a 5-minute profile: target roles, companies you admire, location, and what matters most. We save everything — no repeat inputs.",
    detail: "Resume · Priorities · Location · Role type",
  },
  {
    number: "02",
    title: "Your batch drops every 3 days",
    description:
      "5 roles arrive in your dashboard, each with the alumni or recruiter contact who can get you in, a ready-to-send outreach message, and resume bullets rewritten for that specific company.",
    detail: "Dashboard · Contacts · Outreach · Tailored resume",
  },
  {
    number: "03",
    title: "Execute without second-guessing",
    description:
      "Copy the outreach, download your tailored resume, and apply. Track your pipeline in the applications tab. Refer classmates and earn free weeks.",
    detail: "Apply · Track · Refer · Repeat",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="space-y-10">
      <FadeIn>
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="Three steps. Real results."
          description="Every piece is designed to get you from inbox to interview — not from inbox to another tab you forget about."
        />
      </FadeIn>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <FadeIn key={step.number} delay={i * 0.1}>
            <Card className="space-y-4 relative h-full">
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
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
