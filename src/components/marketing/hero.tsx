import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-[var(--panel)]/60 px-8 py-16 shadow-[0_35px_120px_rgba(5,6,10,0.65)]">
      <div className="space-y-8">
        <Badge>Weekly job intelligence for serious students</Badge>
        <div className="space-y-6">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-5xl">
            Stop mass applying. Move with a plan.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            OneMinuteCloser Weekly builds a personalized job strategy every week — curated companies,
            alumni referral paths, outreach templates, and resume edits. Built for ambitious CS and
            business students who want a premium edge.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Join now</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#report">See sample report</Link>
          </Button>
        </div>
        <div className="grid gap-4 text-sm text-white/60 md:grid-cols-3">
          {["Tailored companies + roles", "Alumni referral intelligence", "Resume edits + outreach templates"].map(
            (item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80"
              >
                {item}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-1/4 top-0 h-40 rounded-full bg-[var(--accent-strong)]/30 blur-[90px]" />
      </div>
    </section>
  );
}
