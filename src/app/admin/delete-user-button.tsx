"use client";

import { useTransition } from "react";
import { deleteUserAction } from "./actions";

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.append("userId", userId);
    startTransition(() => { deleteUserAction(fd); });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleDelete}
      className="text-xs text-red-400/50 hover:text-red-400 disabled:opacity-40 transition px-2 py-1"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
