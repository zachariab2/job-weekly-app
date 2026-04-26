"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscriptionAction } from "../billing/actions";

export function CancelButton() {
  const [pending, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);
  const router = useRouter();

  function handleCancel() {
    if (!confirm("Cancel your subscription? You'll keep access until the end of your current billing period.")) return;
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.error) {
        alert(result.error);
      } else {
        setCancelled(true);
        // Refresh after a short delay so the message is seen first
        setTimeout(() => router.refresh(), 2500);
      }
    });
  }

  if (cancelled) {
    return (
      <p className="text-xs text-white/50 max-w-[200px] text-right leading-relaxed">
        Subscription cancelled. You'll receive a farewell email from us within 1–3 business days.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={pending}
      className="text-xs text-red-400/60 hover:text-red-400 transition disabled:opacity-40"
    >
      {pending ? "Canceling…" : "Cancel subscription"}
    </button>
  );
}
