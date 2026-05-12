import { NextResponse } from "next/server";

export async function GET() {
  const diagnostics = {
    smtpHost: process.env.SMTP_HOST ? "✓ configurado" : "✗ FALTA",
    smtpPort: process.env.SMTP_PORT || "587",
    smtpSecure: process.env.SMTP_SECURE || "false",
    smtpUser: process.env.SMTP_USER ? "✓ configurado" : "✗ FALTA",
    smtpPass: process.env.SMTP_PASS ? `✓ configurado (${process.env.SMTP_PASS.length} caracteres)` : "✗ FALTA",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ configurado" : "✗ FALTA",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "pon_aqui_tu_anon_key" ? "✗ sigue siendo placeholder" : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ configurado" : "✗ FALTA",
  };

  return NextResponse.json({
    status: "diagnóstico",
    note: "Gmail App Passwords tienen 16 caracteres. Si el tuyo no funciona, genera uno nuevo en https://myaccount.google.com/apppasswords",
    ...diagnostics,
  });
}
