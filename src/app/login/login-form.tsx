"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const initialState = { error: undefined as string | undefined };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <label className="space-y-2 text-sm text-white/70">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          placeholder="you@school.edu"
        />
      </label>
      <label className="space-y-2 text-sm text-white/70">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          placeholder="••••••••"
        />
      </label>
      {state.error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.error}
        </div>
      )}
      <Button className="w-full">Log in</Button>
      <p className="text-xs text-white/50">
        Need an account? <Link href="/signup" className="text-[var(--accent)]">Join the paid plan</Link>.
      </p>
    </form>
  );
}
