"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-white/30">Error</p>
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        {error.message && (
          <p className="mt-2 max-w-lg rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left font-mono text-xs text-red-300">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-xs text-white/25">Digest: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/30 hover:text-white/80"
      >
        Try again
      </button>
    </div>
  );
}
