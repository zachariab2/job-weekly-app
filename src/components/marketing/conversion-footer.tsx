import { Button } from "../ui/button";
import Link from "next/link";

export function ConversionFooter() {
  return (
    <section className="relative isolate overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-[var(--panel)]/60 px-8 py-20 text-center shadow-[0_35px_120px_rgba(5,6,10,0.65)]">
      <div className="space-y-6 max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-white/30">Stop waiting, start moving</p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white md:text-4xl lg:text-5xl">
          Your next offer starts<br className="hidden sm:block" /> with the right five roles.
        </h2>
        <p className="text-base text-white/55 leading-relaxed">
          First report lands in minutes. Roles matched to your profile. Alumni paths to get you in.
          Cancel anytime.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button size="lg" asChild>
            <Link href="/signup">Get started — $9.99/week</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#report">See a sample report</Link>
          </Button>
        </div>
        <p className="text-xs text-white/20 pt-2">
          No contracts · cancel from settings in one click · refer 3 friends, earn a free week
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-1/3 bottom-0 h-48 rounded-full bg-[var(--accent-strong)]/20 blur-[100px]" />
      </div>
    </section>
  );
}
