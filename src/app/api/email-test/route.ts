import { NextResponse } from "next/server";
import { testEmailConnection } from "@/lib/email";

export async function GET() {
  const result = await testEmailConnection();
  if (result.ok) {
    return NextResponse.json({ success: true, message: result.message });
  }
  return NextResponse.json({ success: false, message: result.message }, { status: 400 });
}
