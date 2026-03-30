"use client";

import { deleteUserAction } from "./actions";

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  return (
    <form action={deleteUserAction}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="text-xs text-red-400/50 hover:text-red-400 transition px-2 py-1"
        onClick={(e) => {
          if (!confirm(`Delete ${email}? This cannot be undone.`)) e.preventDefault();
        }}
      >
        Delete
      </button>
    </form>
  );
}
