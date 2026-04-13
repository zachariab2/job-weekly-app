"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Auto-refreshes the page every 3s after checkout until subscription is active.
// The server will redirect to /applications once the webhook fires.
export function BillingPolling() {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);
  return null;
}
