import { Button } from "../ui/button";
import Link from "next/link";

export function ConversionFooter() {
  return (
    <section className="relative isolate overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-[var(--panel)]/60 px-8 py-16 text-center shadow-[0_35px_120px_rgba(5,6,10,0.65)]">
      <div className="space-y-6 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-white/30">Ready when you are</p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl">
          Your next referral is one batch away.
        </h2>
        <p className="text-base text-white/60">
          Cancel anytime. Your first report lands within minutes of signing up.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button size="lg" asChild>
            <Link href="/signup">Join now</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#report">See sample report</Link>
          </Button>
        </div>
        <p className="text-xs text-white/25 pt-2">
          $9.99/week · cancel from settings in one click · referrals earn free weeks
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-1/3 bottom-0 h-40 rounded-full bg-[var(--accent-strong)]/20 blur-[80px]" />
      </div>
    </section>
  );
}
