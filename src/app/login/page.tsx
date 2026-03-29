import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-20">
      <Card className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Access</p>
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        </div>
        <LoginForm next={next} />
      </Card>
    </div>
  );
}
