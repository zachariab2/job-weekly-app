"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateSubscriptionAction } from "../billing/actions";

export function ReactivateButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateSubscriptionAction();
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleReactivate}
      disabled={pending}
      className="rounded-xl bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition disabled:opacity-40"
    >
      {pending ? "Reactivating…" : "Reactivate"}
    </button>
  );
}
