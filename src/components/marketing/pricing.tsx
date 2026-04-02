import { SectionHeading } from "../ui/section-heading";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

const features = [
  "5 curated roles per batch, refreshed every 3 days",
  "Alumni + adjacent referral contacts per role",
  "Resume bullets rewritten per company",
  "Outreach templates ready to copy and send",
  "Application tracker and profile health score",
  "Email + SMS alerts when your batch drops",
  "Human support — reply to any email, 24h response",
];

export function Pricing() {
  return (
    <section id="pricing" className="space-y-10">
      <SectionHeading
        eyebrow="PRICING"
        title="One plan. Everything included."
        description="$9.99 a week is less than one coffee meeting. One referral that converts to an interview pays it back 100×."
      />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm text-white/50">For students</p>
              <p className="text-5xl font-semibold text-white mt-1">$9.99</p>
              <p className="text-sm text-white/40 mt-1">per week · cancel anytime</p>
            </div>
            <div className="rounded-2xl border border-[var(--accent-strong)]/20 bg-[var(--accent-strong)]/5 px-4 py-3 max-w-[240px]">
              <p className="text-xs text-white/50 leading-relaxed">
                <span className="font-semibold text-white/70">Who this is for:</span> CS, business, and engineering students actively recruiting who want targeted moves, not a spray-and-pray list.
              </p>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--accent-strong)]" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
            <Button size="lg" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="#report">See sample report</Link>
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 bg-white/[0.03]">
            <p className="text-sm text-white/50">Referral program</p>
            <p className="text-lg font-semibold text-white">Earn free weeks</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Every 3 paying friends you refer earns you one free week — automatically credited when their payment clears.
            </p>
            <p className="text-xs text-white/30 leading-relaxed pt-1 border-t border-white/5">
              Share your code from the billing page. No limits on how many you refer.
            </p>
          </Card>

          <Card className="space-y-3 bg-white/[0.03]">
            <p className="text-sm text-white/50">For career centers & programs</p>
            <p className="text-lg font-semibold text-white">Campus licensing</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Cohort-wide access with a custom domain, usage analytics, and concierge onboarding for your students.
            </p>
            <Button variant="secondary" size="sm" asChild>
              <Link href="mailto:hello@getjobweekly.com">Get in touch</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
