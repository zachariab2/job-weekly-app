import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("PDF export not available", { status: 410 });
}
