import { Dis2Client } from "@/app/dis-2/dis2-client";

export const metadata = {
  title: "Dis-2 | CS-391",
};

export default function Dis2Page() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold">Dis-2 (Next.js version)</h1>
      <p className="text-sm text-white/70">
        API key stays on the server in <code>.env.local</code>. The button calls our backend route, and
        the response is rendered as list items.
      </p>
      <Dis2Client />
    </main>
  );
}
