import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="space-y-10">
      <SectionHeading
        eyebrow="PRICING"
        title="$9.99 per week"
        description="Cancel anytime — every three referrals you send still earns a free week."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start gap-6">
            <div className="shrink-0">
              <p className="text-sm text-white/60">For students</p>
              <p className="text-4xl font-semibold text-white">$9.99</p>
              <p className="text-sm text-white/50">per week · cancel anytime</p>
              <p className="mt-3 text-xs text-white/40 max-w-[200px] leading-relaxed">
                One referral that converts to an interview is worth 100× this. Most students see ROI in week one.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Fresh job batch every 3 days, matched to your profile</li>
              <li>• Alumni + adjacent referral paths per role</li>
              <li>• Resume bullets rewritten for each company</li>
              <li>• Outreach templates ready to send</li>
              <li>• Applications tracker & profile health</li>
              <li>• Email + SMS alerts when your batch drops</li>
            </ul>
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--accent-strong)]/20 bg-[var(--accent-strong)]/5 px-4 py-3">
            <p className="text-xs text-white/50">
              <span className="font-semibold text-white/70">Who this is for:</span> CS, business, and engineering students actively recruiting who want a systematic edge over mass-applicants. If you&apos;re sending 50 generic apps a week, this replaces that with 5 targeted ones that actually land.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Join now</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="#how">Explore how it works</Link>
            </Button>
          </div>
        </Card>
        <Card className="space-y-3 bg-white/5">
          <p className="text-sm text-white/60">For programs & career centers</p>
          <p className="text-xl font-semibold text-white">Campus licensing</p>
          <p className="text-sm text-white/70">
            Offer structured weekly plans to your cohort. Custom domains, analytics, and concierge onboarding.
          </p>
          <Button variant="secondary">Book a demo</Button>
        </Card>
      </div>
    </section>
  );
}
