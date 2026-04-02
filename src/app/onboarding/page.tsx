"use client";

import { useState, useRef, useTransition } from "react";
import { completeOnboarding, uploadResumeAction, parseResumeFieldsAction } from "./actions";
import { Button } from "@/components/ui/button";

const TOTAL_STEPS = 6;

const MAJOR_OPTIONS = [
  "Computer Science",
  "Software Engineering",
  "Computer Engineering",
  "Data Science",
  "Information Systems",
  "Electrical Engineering",
  "Mathematics",
  "Statistics",
  "Physics",
  "Business",
  "Other",
];

const ROLE_OPTIONS = [
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
  "Data Analyst",
  "ML Engineer",
  "Product Manager",
  "Other",
];

const JOB_TYPE_OPTIONS = ["Internship", "Co-op", "New Grad", "Full-time", "Contract"];

const CITY_OPTIONS = [
  "New York",
  "San Francisco",
  "Seattle",
  "Boston",
  "Austin",
  "Los Angeles",
  "Chicago",
  "Washington DC",
  "Denver",
  "Atlanta",
  "Remote",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeValid, setResumeValid] = useState<boolean | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setError(null);
    if (step === 2 && (!form.firstName?.trim() || !form.lastName?.trim())) {
      setError("Please enter your first and last name before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() { setError(null); setStep((s) => Math.max(s - 1, 0)); }

  async function handleFile(file: File | null) {
    if (!file) return;
    setResumeFile(file);
    setResumeValid(null);
    setIsParsing(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const { fields, isResume } = await parseResumeFieldsAction(fd);
      setResumeValid(isResume);
      if (isResume) {
        setForm((prev) => ({
          ...prev,
          ...(fields.firstName ? { firstName: fields.firstName } : {}),
          ...(fields.lastName ? { lastName: fields.lastName } : {}),
          ...(fields.university ? { university: fields.university } : {}),
          ...(fields.major ? { major: fields.major } : {}),
          ...(fields.graduation ? { graduation: fields.graduation } : {}),
          ...(fields.linkedin ? { linkedin: fields.linkedin } : {}),
          ...(fields.github ? { github: fields.github } : {}),
        }));
      }
    } catch {
      setResumeValid(true); // on error allow through
    } finally {
      setIsParsing(false);
    }
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
                { title: "5 curated jobs, refreshed every 3 days", body: "Real CS roles matched to your profile — internships, co-ops, new grad. A new batch drops automatically every 3 days so the list stays fresh." },
                { title: "Referral contacts for every job", body: "Alumni from your school first. No match? We find engineers with similar backgrounds and give you their contact info + a ready-to-send message." },
                { title: "Resume tweaks per application", body: "Upload your resume once. We highlight what to change for each role based on the job description." },
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
                We&apos;ll read it to auto-fill your name, school, and major on the next step. PDF only.
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
              {isParsing ? (
                <>
                  <p className="text-3xl">⏳</p>
                  <p className="text-sm text-white/60">Reading your resume…</p>
                  <p className="text-xs text-white/30">We&apos;ll auto-fill your info on the next step</p>
                </>
              ) : resumeFile ? (
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
            {resumeFile && resumeValid === false && (
              <p className="text-xs text-red-400 text-center">
                That doesn&apos;t look like a resume. Please upload your actual resume PDF.
              </p>
            )}
            {resumeFile && resumeValid === true && (
              <p className="text-xs text-emerald-400/70 text-center">
                Resume verified — we&apos;ll auto-fill your info on the next step.
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
              <SelectField
                label="Major"
                name="major"
                value={form.major}
                onChange={set}
                options={MAJOR_OPTIONS}
                placeholder="Select your major"
              />
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
              <MultiPillGroup label="Target role(s)" name="targetRole" options={ROLE_OPTIONS} value={form.targetRole} onChange={set} />
              <Field label="Industries" name="industries" value={form.industries} onChange={set} placeholder="AI / ML, Fintech, Developer Tools" />
              <MultiPillGroup label="Job type(s)" name="jobTypes" options={JOB_TYPE_OPTIONS} value={form.jobTypes} onChange={set} />
              <MultiPillGroup label="Preferred locations" name="locations" options={CITY_OPTIONS} value={form.locations} onChange={set} />
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

        {/* Step 5: Checkout */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Let&apos;s get you a job.</h1>
              <p className="mt-1 text-sm text-white/50">Your first batch drops within minutes. $9.99/week — cancel anytime.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">JobWeekly membership</p>
                  <p className="text-xs text-white/40 mt-0.5">Billed weekly · cancel from settings anytime</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-white">$9.99</p>
                  <p className="text-xs text-white/35">per week</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-white/50 pt-2 border-t border-white/5">
                {[
                  "5 curated roles matched to your profile, refreshed every 3 days",
                  "Alumni referral paths with contact info",
                  "Resume bullets rewritten per company",
                  "Outreach templates ready to send",
                  "Email + SMS alerts when your batch drops",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent-strong)] shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-white/25 pt-2">
                You&apos;ll complete payment on Stripe&apos;s secure checkout. Have a promo code? You can enter it there.
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
            <Button onClick={next} disabled={(step === 1 && (!resumeFile || resumeValid === false)) || isParsing}>
              {isParsing ? "Checking…" : step === 0 ? "Get started →" : "Continue →"}
            </Button>
          ) : (
            <Button onClick={submit} disabled={isPending}>
              {isPending ? "Setting up…" : "Get my jobs →"}
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

function MultiPillGroup({ label, name, options, value, onChange }: {
  label: string; name: string; options: string[]; value?: string; onChange: (k: string, v: string) => void;
}) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : [...selected, option];
    onChange(name, next.join(", "));
  }
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              selected.includes(o)
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

function SelectField({ label, name, value, onChange, options, placeholder }: {
  label: string;
  name: string;
  value?: string;
  onChange: (k: string, v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30 mb-1.5">{label}</p>
      <select
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[var(--accent-strong)]/50 focus:outline-none transition"
      >
        <option value="" disabled className="bg-black text-white/60">
          {placeholder ?? "Select one"}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-black text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
