"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem", textAlign: "center", padding: "1.5rem" }}>
          <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>Global Error</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
          {error.digest && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>Digest: {error.digest}</p>
          )}
          <button onClick={reset} style={{ marginTop: "0.5rem", padding: "0.5rem 1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
