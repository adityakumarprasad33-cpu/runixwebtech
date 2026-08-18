import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Extract all headers safely for diagnostic purposes
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    // Filter out sensitive headers as requested
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("cookie") ||
      lowerKey.includes("authorization") ||
      lowerKey.includes("token")
    ) {
      return;
    }
    headersObj[lowerKey] = value;
  });

  return NextResponse.json({
    message: "Netlify Request Diagnostics",
    method: req.method,
    headers: headersObj,
  });
}
