"use client";

import { useState, useRef, useTransition } from "react";
import { completeOnboarding, uploadResumeAction } from "./actions";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() { setError(null); setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); }
  function back() { setError(null); setStep((s) => Math.max(s - 1, 0)); }

  function handleFile(file: File | null) {
    if (!file) return;
    setResumeFile(file);
    // Auto-fill from filename as placeholder until Claude API parses it
    set("resumeName", file.name);
  }

  function submit() {
    startTransition(async () => {
      // Upload resume first if one was selected
      if (resumeFile) {
        const fd = new FormData();
        fd.append("resume", resumeFile);
        const uploadResult = await uploadResumeAction(fd);
        if (uploadResult?.status === "error") {
          setError(uploadResult.message);
          return;
        }
      }
      const result = await completeOnboarding(form);
      if (result?.status === "error") setError(result.message);
    });
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl space-y-8">

        {/* Progress */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-white/30">JobWeekly · Setup</p>
          <div className="h-1 w-full rounded-full bg-white/10">
            <div className="h-1 rounded-full bg-[var(--accent-strong)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-white/30">Step {step + 1} of {TOTAL_STEPS}</p>
        </div>

        {/* Step 0: What you get */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Here&apos;s what JobWeekly does</h1>
              <p className="mt-1 text-sm text-white/50">We handle the research. You just apply.</p>
            </div>
            <div className="space-y-2.5">
              {[
                { title: "Curated job list, updated constantly", body: "CS-relevant roles pulled from Greenhouse, Lever, and GitHub — filtered to match your profile." },
                { title: "Referral contacts for every job", body: "Alumni from your school first. No match? We find engineers with similar backgrounds and give you their contact info + a ready-to-send message." },
                { title: "Resume tweaks per application", body: "Upload your resume once. We highlight what to change for each role. Accept a suggestion and your resume updates automatically." },
                { title: "Notifications when new matches drop", body: "You pick the threshold. Get a text or email when new unactioned jobs appear — no spam." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/50 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Resume upload FIRST — so we can auto-fill */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Upload your resume</h1>
              <p className="mt-1 text-sm text-white/50">
                We&apos;ll use it to auto-fill your profile and tailor suggestions per job. PDF only.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
              className="cursor-pointer rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] p-12 text-center space-y-3 hover:border-[var(--accent-strong)]/40 hover:bg-white/[0.05] transition"
            >
              {resumeFile ? (
                <>
                  <p className="text-3xl">✅</p>
                  <p className="text-sm font-medium text-white">{resumeFile.name}</p>
                  <p className="text-xs text-white/40">Click to replace</p>
                </>
              ) : (
                <>
                  <p className="text-3xl">📄</p>
                  <p className="text-sm text-white/70">Click to browse or drag your resume here</p>
                  <p className="text-xs text-white/30">PDF only · max 5MB</p>
                </>
              )}
            </div>

            {!resumeFile && (
              <p className="text-xs text-red-400/70 text-center">
                Resume is required — we need it to tailor suggestions per job.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Basic info (auto-filled from resume in future) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Your info</h1>
              <p className="mt-1 text-sm text-white/50">
                {resumeFile ? "Auto-filled from your resume — review and edit." : "Tell us a bit about yourself."}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name *" name="firstName" value={form.firstName} onChange={set} placeholder="Alex" />
                <Field label="Last name *" name="lastName" value={form.lastName} onChange={set} placeholder="Chen" />
              </div>
              <Field label="University" name="university" value={form.university} onChange={set} placeholder="MIT" />
              <Field label="Major" name="major" value={form.major} onChange={set} placeholder="Computer Science" />
              <Field label="Graduation" name="graduation" value={form.graduation} onChange={set} placeholder="May 2026" />
              <Field label="LinkedIn URL" name="linkedin" value={form.linkedin} onChange={set} placeholder="linkedin.com/in/yourname" />
              <Field label="GitHub username" name="github" value={form.github} onChange={set} placeholder="yourhandle" />
            </div>
          </div>
        )}

        {/* Step 3: Job preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Job preferences</h1>
              <p className="mt-1 text-sm text-white/50">The more specific, the better your matches.</p>
            </div>
            <div className="space-y-4">
              <Field label="Target roles" name="targetRole" value={form.targetRole} onChange={set} placeholder="Software Engineer, ML Engineer" />
              <Field label="Industries" name="industries" value={form.industries} onChange={set} placeholder="AI / ML, Fintech, Developer Tools" />
              <PillGroup label="Job type" name="jobTypes" options={["Full-time", "Internship", "Co-op", "Contract"]} value={form.jobTypes} onChange={set} />
              <Field label="Preferred locations" name="locations" value={form.locations} onChange={set} placeholder="NYC, SF, Remote" />
              <PillGroup label="Remote preference" name="relocation" options={["On-site", "Hybrid", "Remote", "Any"]} value={form.relocation} onChange={set} />
              <Field label="Dream companies (optional)" name="dreamCompanies" value={form.dreamCompanies} onChange={set} placeholder="Stripe, Figma, Notion" />
            </div>
          </div>
        )}

        {/* Step 4: Notifications */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Notifications</h1>
              <p className="mt-1 text-sm text-white/50">We&apos;ll ping you when new matching jobs drop. You control when and how.</p>
            </div>
            <div className="space-y-5">
              <PillGroup
                label="Notify me when this many unactioned jobs are waiting"
                name="notificationThreshold"
                options={["1", "3", "5", "10", "Never"]}
                value={form.notificationThreshold}
                onChange={set}
              />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">How to notify me</p>
                <div className="flex gap-2">
                  {(["Email", "SMS"] as const).map((ch) => {
                    const key = ch === "Email" ? "emailNotif" : "smsNotif";
                    const active = form[key] === "true";
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => set(key, active ? "false" : "true")}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${active ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/10 text-[var(--accent-strong)]" : "border-white/15 text-white/50 hover:border-white/30"}`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
              {form.smsNotif === "true" && (
                <Field label="Phone number" name="phone" value={form.phone} onChange={set} placeholder="+1 (555) 000-0000" />
              )}
            </div>
          </div>
        )}

        {/* Step 5: Free trial */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Start your free trial</h1>
              <p className="mt-1 text-sm text-white/50">7 days free — card required but nothing charged until trial ends.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">JobWeekly membership</p>
                  <p className="text-xs text-white/40 mt-0.5">Free for 7 days, then $9.99/week</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-white">$0</p>
                  <p className="text-xs text-white/35">today</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-white/50 pt-2 border-t border-white/5">
                {["Curated CS jobs, updated constantly", "Alumni + similar-background referral contacts with contact info", "AI resume tweaks per application", "SMS + email notifications you control", "Cancel anytime before trial ends"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent-strong)] shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-white/25 pt-2">
                You&apos;ll enter card details on Stripe&apos;s secure checkout. We won&apos;t charge until day 8.
              </p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {step > 0 ? (
            <button onClick={back} className="text-sm text-white/40 hover:text-white/70 transition">
              ← Back
            </button>
          ) : <span />}

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} disabled={step === 1 && !resumeFile}>
              {step === 0 ? "Get started →" : "Continue →"}
            </Button>
          ) : (
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Setting up…" : "Start free trial →"}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value?: string; onChange: (k: string, v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1.5">{label}</p>
      <input
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[var(--accent-strong)]/50 focus:outline-none transition"
      />
    </div>
  );
}

function PillGroup({ label, name, options, value, onChange }: {
  label: string; name: string; options: string[]; value?: string; onChange: (k: string, v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(name, o)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              value === o
                ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/10 text-[var(--accent-strong)]"
                : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
