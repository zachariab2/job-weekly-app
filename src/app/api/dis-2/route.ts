import { NextResponse } from "next/server";

import { fetchDis2Items } from "@/lib/dis2/server";
import { type Dis2ApiResponse } from "@/lib/dis2/types";

export async function GET() {
  try {
    const items = await fetchDis2Items();
    const body: Dis2ApiResponse = { items };

    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to fetch BIN data",
        details: message,
      },
      { status: 500 },
    );
  }
}
