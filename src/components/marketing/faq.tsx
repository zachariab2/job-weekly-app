import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { FadeIn } from "./fade-in";

const faqs = [
  {
    q: "Is this an auto-apply bot?",
    a: "No. We focus on strategy and execution — you still control every outreach and application. The difference is you're moving with a plan: the right 10 roles, the referral path in, and a resume written for that company. Not 50 cold shots.",
  },
  {
    q: "How is this different from LinkedIn or Handshake?",
    a: "Job boards show you everything and leave the rest to you. JobWeekly curates 10 roles matched to your profile, finds referral contacts at each one, rewrites your resume for each company, and writes the outreach message. You just execute.",
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
    a: "Yes. Your resume and preferences are stored securely and never sold or shared. We use OpenAI's API for report generation — by default they do not train on API data.",
  },
  {
    q: "What majors and roles are supported?",
    a: "Best results for CS, software engineering, data science, business, and engineering majors targeting software, data, ML, or PM roles. If your role isn't in our list, you can describe it freeform — we'll do our best to match relevant jobs.",
  },
  {
    q: "Can I pause or cancel?",
    a: "Cancel anytime from settings in one click. No contracts, no hidden fees. You keep access until the end of the period you already paid for.",
  },
  {
    q: "What if I need help?",
    a: "Email getjobweekly@gmail.com and we'll get back to you. We're early-stage and read every message.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="space-y-10">
      <FadeIn>
        <SectionHeading
          eyebrow="FAQ"
          title="Straight answers"
          description="No fluff. If something's missing, email us — we'll add it."
        />
      </FadeIn>
      <div className="grid gap-4 md:grid-cols-2">
        {faqs.map((faq, i) => (
          <FadeIn key={faq.q} delay={i * 0.05}>
            <Card className="space-y-2 h-full">
              <p className="text-sm font-semibold text-white">{faq.q}</p>
              <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
            </Card>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
