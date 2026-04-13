"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auto-refreshes every 3s after checkout until webhook fires and subscription activates.
// Gives up after 2 minutes to avoid infinite loop if webhook is delayed.
export function BillingPolling() {
  const router = useRouter();
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > 120_000) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);
  return null;
}
