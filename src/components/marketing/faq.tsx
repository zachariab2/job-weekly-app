import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";

const faqs = [
  {
    q: "Is this an auto-apply bot?",
    a: "No. We focus on strategy, personalization, and execution. You still control every outreach and application — but with a concrete plan instead of a spray-and-pray list.",
  },
  {
    q: "Where does the job data come from?",
    a: "Live job feeds refreshed every 3 days, filtered and matched against your profile, target roles, and location preferences. No stale listings — if a role closed, it’s gone.",
  },
  {
    q: "Is my data private?",
    a: "Your resume and preferences are stored securely and never sold, shared, or used to train models. We use industry-standard encryption at rest and in transit.",
  },
  {
    q: "Can non-CS students use it?",
    a: "Yes. We started with CS + business, but the onboarding supports any major. The AI adapts to your background — design, finance, biotech, whatever.",
  },
  {
    q: "Can I pause or cancel?",
    a: "Cancel anytime from billing settings — takes 10 seconds. No contracts, no hidden fees. Your data stays accessible for 30 days post-cancellation.",
  },
  {
    q: "What if I need support?",
    a: "Reply to any notification email and a human responds within 24 hours. We’re early-stage and take support personally.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="space-y-10">
      <SectionHeading
        eyebrow="DETAILS"
        title="Straight answers"
        description="Built to feel like a consulting partner, not a growth hack."
      />
      <div className="grid gap-6 md:grid-cols-2">
        {faqs.map((faq) => (
          <Card key={faq.q} className="space-y-3">
            <p className="text-base font-semibold text-white">{faq.q}</p>
            <p className="text-sm text-white/70">{faq.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
