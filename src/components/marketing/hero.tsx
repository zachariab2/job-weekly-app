"use client";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  "10 roles matched to your resume",
  "Alumni & recruiter contacts at each company",
  "Outreach message written for you",
  "Resume bullets tailored per company",
  "Refreshes every 3 days automatically",
  "One-click tailored resume download",
];

const testimonials = [
  {
    quote: "Got my Databricks interview from an alumni intro in week two. Worth it.",
    name: "Alex M.",
    school: "BU CS '26",
  },
  {
    quote: "Stopped cold-applying after the first report. The referral paths are the real product.",
    name: "Priya S.",
    school: "St. John's '25",
  },
  {
    quote: "My resume bullet for Jane Street was rewritten in 10 minutes. I got a callback.",
    name: "Jordan T.",
    school: "Colgate '26",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-[var(--panel)]/60 px-8 py-16 shadow-[0_35px_120px_rgba(5,6,10,0.65)]">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">

        <motion.div variants={item}>
          <Badge>Weekly job intelligence for serious students</Badge>
        </motion.div>

        <div className="space-y-5">
          <motion.h1
            variants={item}
            className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-5xl lg:text-6xl"
          >
            The contacts to get in.<br className="hidden sm:block" />
            <span className="text-[var(--accent-strong)]"> Done for you.</span>
          </motion.h1>
          <motion.p variants={item} className="max-w-2xl text-lg text-white/65 leading-relaxed">
            Every 3 days, JobWeekly delivers 10 roles curated to your resume — each with the alumni
            contact who can refer you, the outreach message to send them, and resume bullets
            rewritten for that specific company. No cold-applying. No guessing.
          </motion.p>
        </div>

        <motion.div variants={item} className="flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Get started — $9.99/week</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#report">See a sample report</Link>
          </Button>
        </motion.div>

        {/* Feature checklist */}
        <motion.div variants={item} className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-strong)]/15 text-[var(--accent-strong)]">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm text-white/70">{f}</span>
            </div>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div variants={item} className="border-t border-white/8 pt-8 space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/30">What students say</p>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <p className="text-sm text-white/75 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-xs font-semibold text-white/60">{t.name}</p>
                  <p className="text-xs text-white/30">{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-1/4 top-0 h-40 rounded-full bg-[var(--accent-strong)]/30 blur-[90px]" />
      </div>
    </section>
  );
}
