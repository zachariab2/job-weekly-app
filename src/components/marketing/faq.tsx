import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";

const faqs = [
  {
    q: "Is this an auto-apply bot?",
    a: "No. We focus on strategy, personalization, and execution. You still control every outreach and application, but with premium guidance.",
  },
  {
    q: "Where does the data come from?",
    a: "We combine curated job feeds, alumni datasets, and your own inputs. The architecture is built for licensed APIs when you plug them in.",
  },
  {
    q: "Can non-CS students use it?",
    a: "Yes. We’re starting with CS + business, but the onboarding captures any major, so expanding is straightforward.",
  },
  {
    q: "Can I pause my subscription?",
    a: "You can pause or cancel anytime from billing settings. No hidden fees, no yearly lock-in.",
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
