import { Card } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-20">
      <Card className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">No trial — pay to play</p>
          <h1 className="text-3xl font-semibold text-white">Join the weekly concierge</h1>
          <p className="text-sm text-white/60">
            $9.99 billed weekly. Referral credits add a free week after every three paying friends.
          </p>
        </div>
        <SignupForm />
      </Card>
    </div>
  );
}
