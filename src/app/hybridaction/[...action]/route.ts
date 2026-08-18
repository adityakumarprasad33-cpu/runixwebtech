import { NextResponse } from "next/server";

// Silent handler for browser extension tracking requests (e.g. translation / dictionary extensions)
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
