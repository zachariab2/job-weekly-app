import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";

const steps = [
  {
    title: "1. Premium onboarding",
    description:
      "Multi-step intake captures resume, priorities, constraints, and networking preferences with autosave and review.",
  },
  {
    title: "2. Weekly intelligence",
    description:
      "Each Tuesday a structured report drops via dashboard, PDF, email, and text with prioritized opportunities.",
  },
  {
    title: "3. Act with clarity",
    description:
      "Alumni paths, outreach scripts, resume changes, and application tracker keep momentum without chaos.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="space-y-10">
      <SectionHeading
        eyebrow="OPERATING SYSTEM"
        title="Serious students, structured job searches"
        description="The entire experience is designed to feel like a private career team working behind the scenes for you."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} className="space-y-3">
            <p className="text-sm text-white/50">{step.title}</p>
            <p className="text-base text-white/80">{step.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
