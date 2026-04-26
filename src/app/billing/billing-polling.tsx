"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Auto-refreshes every 3s after checkout until webhook fires and subscription activates.
// Gives up after 2 minutes and shows a manual escape button.
export function BillingPolling() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > 120_000) {
        clearInterval(interval);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  if (!timedOut) return null;

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/80 flex items-center justify-between gap-4">
      <p>Taking longer than expected. Your payment went through — try refreshing or go to the dashboard.</p>
      <Link href="/applications" className="shrink-0 rounded-xl border border-amber-300/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20 transition">
        Go to dashboard →
      </Link>
    </div>
  );
}
