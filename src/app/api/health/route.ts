import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "0.3.1",
    name: "nido",
    timestamp: new Date().toISOString(),
  });
}
