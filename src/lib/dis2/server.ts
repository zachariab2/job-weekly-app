import { type Dis2Item } from "@/lib/dis2/types";

const JSONBIN_BIN_URL_ENV = "JSONBIN_BIN_URL";
const JSONBIN_API_KEY_ENV = "JSONBIN_API_KEY";

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toItemArray(value: unknown): Dis2Item[] {
  if (Array.isArray(value)) {
    return value.filter(isObject) as Dis2Item[];
  }

  if (isObject(value)) {
    const recordValue = value.record;

    if (Array.isArray(recordValue)) {
      return recordValue.filter(isObject) as Dis2Item[];
    }

    if (isObject(recordValue)) {
      return [recordValue as Dis2Item];
    }

    return [value as Dis2Item];
  }

  return [];
}

export async function fetchDis2Items(): Promise<Dis2Item[]> {
  const binUrl = readRequiredEnv(JSONBIN_BIN_URL_ENV);
  const apiKey = readRequiredEnv(JSONBIN_API_KEY_ENV);

  const response = await fetch(binUrl, {
    method: "GET",
    headers: {
      "X-Master-Key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`JSONBin request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return toItemArray(payload);
}
