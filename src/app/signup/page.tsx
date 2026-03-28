import { Card } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-20">
      <Card className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Let&apos;s get you a job</p>
          <h1 className="text-3xl font-semibold text-white">Join JobWeekly</h1>
          <p className="text-sm text-white/60">
            $9.99/week. Your first batch drops within minutes. Cancel anytime.
          </p>
        </div>
        <SignupForm />
      </Card>
    </div>
  );
}
