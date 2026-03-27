"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { type Dis2ApiResponse, type Dis2Item } from "@/lib/dis2/types";

function formatItem(item: Dis2Item): string {
  const entries = Object.entries(item);

  if (!entries.length) {
    return "(empty object)";
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export function Dis2Client() {
  const [items, setItems] = useState<Dis2Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dis-2");

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = (await response.json()) as Dis2ApiResponse;
      setItems(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <Button onClick={handleFetchData} disabled={loading}>
        {loading ? "Loading..." : "Fetch BIN Data"}
      </Button>

      {error ? <p className="text-red-400">{error}</p> : null}

      <ul className="space-y-2" id="dis-2-output">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            {formatItem(item)}
          </li>
        ))}
      </ul>
    </section>
  );
}
