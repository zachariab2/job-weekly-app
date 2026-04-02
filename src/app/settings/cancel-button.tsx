"use client";

import { useTransition } from "react";
import { cancelSubscriptionAction } from "../billing/actions";

export function CancelButton() {
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("Cancel your subscription? You'll keep access until the end of your current billing period.")) return;
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.error) alert(result.error);
    });
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
