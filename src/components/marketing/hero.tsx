import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Link from "next/link";

const testimonials = [
  {
    quote: "Got my Databricks interview from an alumni intro in week two. Worth it.",
    name: "Alex M.",
    school: "Columbia CS '26",
  },
  {
    quote: "Stopped cold-applying after the first report. The referral paths are the real product.",
    name: "Priya S.",
    school: "UPenn Wharton '25",
  },
  {
    quote: "My resume bullet for Jane Street was rewritten in 10 minutes. I got a callback.",
    name: "Jordan T.",
    school: "NYU Stern '26",
  },
];

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
            OneMinuteCloser Weekly builds a personalized job strategy every 3 days — curated roles,
            alumni referral paths, outreach templates, and resume edits. Built for ambitious CS and
            business students who want a real edge.
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

        {/* Social proof */}
        <div className="border-t border-white/8 pt-8 space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/30">What students say</p>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <p className="text-sm text-white/75 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-semibold text-white/60">{t.name}</p>
                  <p className="text-xs text-white/30">{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-1/4 top-0 h-40 rounded-full bg-[var(--accent-strong)]/30 blur-[90px]" />
      </div>
    </section>
  );
}
