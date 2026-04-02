import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";

const faqs = [
  {
    q: "Is this an auto-apply bot?",
    a: "No. We focus on strategy and execution — you still control every outreach and application. The difference is you're moving with a plan: the right 5 roles, the alumni path in, and a resume written for that company. Not 50 cold shots.",
  },
  {
    q: "How is this different from LinkedIn or Handshake?",
    a: "Job boards show you everything and leave the rest to you. JobWeekly curates 5 roles matched to your profile, finds the alumni contacts at each one, rewrites your resume for each company, and writes the outreach message. You just execute.",
  },
  {
    q: "Where does the job data come from?",
    a: "Live job feeds refreshed every 3 days, filtered against your target roles, location, and job type preferences. No stale listings — if a role closed, it's gone.",
  },
  {
    q: "How does the resume tailoring work?",
    a: "When you click 'Tailor my resume' on any role, we rewrite your resume bullets for that specific company's job posting using AI, then generate a downloadable PDF instantly. Your original is always preserved.",
  },
  {
    q: "Is my resume and data private?",
    a: "Yes. Your resume and preferences are stored securely, never sold or shared, and never used to train models. Encrypted at rest and in transit.",
  },
  {
    q: "Can non-CS students use it?",
    a: "Yes. The onboarding supports any major — CS, business, finance, design, biotech, whatever. The AI adapts to your background and targets the right roles.",
  },
  {
    q: "Can I pause or cancel?",
    a: "Cancel anytime from billing settings in one click. No contracts, no hidden fees. Your data stays accessible for 30 days after cancellation.",
  },
  {
    q: "What if I need help?",
    a: "Reply to any notification email and a human gets back to you within 24 hours. We're early-stage and take support seriously.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="space-y-10">
      <SectionHeading
        eyebrow="FAQ"
        title="Straight answers"
        description="No fluff. If something's missing, email us — we'll add it."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => (
          <Card key={faq.q} className="space-y-2">
            <p className="text-sm font-semibold text-white">{faq.q}</p>
            <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
