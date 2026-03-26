// Next.js instrumentation — logs server-side request errors to Vercel function logs
// so we can see the actual message (not the production-obscured version)
export async function onRequestError(
  err: { message: string; stack?: string },
  request: { path: string; method: string },
  context: { routePath?: string },
) {
  console.error(
    "[SERVER ERROR]",
    JSON.stringify({
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 5).join(" | "),
      path: request.path,
      route: context.routePath,
    }),
  );
}
