"use client";

import { useActionState } from "react";
import { signupAction } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const initialState = { error: undefined as string | undefined };

export function SignupForm({ refCode }: { refCode?: string }) {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <form className="grid gap-4 md:grid-cols-2" action={formAction}>
      <label className="space-y-2 text-sm text-white/70">
        <span>First name</span>
        <input name="firstName" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
      </label>
      <label className="space-y-2 text-sm text-white/70">
        <span>Last name</span>
        <input name="lastName" required className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
      </label>
      <label className="space-y-2 text-sm text-white/70">
        <span>School email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        />
      </label>
      <label className="space-y-2 text-sm text-white/70">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        />
      </label>
      <label className="md:col-span-2 space-y-2 text-sm text-white/70">
        <span>Referral code (optional)</span>
        <input
          name="referralCode"
          placeholder="ABC123"
          defaultValue={refCode ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        />
      </label>
      {state.error && (
        <div className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.error}
        </div>
      )}
      <div className="md:col-span-2 space-y-3">
        <Button className="w-full">Create account</Button>
        <p className="text-xs text-white/50">
          $9.99 billed weekly. Referral credits land only after your invitees become paying members. Already inside?{" "}
          <Link href="/login" className="text-[var(--accent)]">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
