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
        description="No trial. Pay to unlock the concierge instantly — every three paid referrals still grant one free week."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-white/60">For students</p>
              <p className="text-4xl font-semibold text-white">$9.99</p>
              <p className="text-sm text-white/50">Charged weekly · referral credits add bonus weeks</p>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Weekly dashboard, PDF, email, SMS drops</li>
              <li>• Alumni + adjacent referral intelligence</li>
              <li>• Resume tailoring per role</li>
              <li>• Applications tracker & profile health</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
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
