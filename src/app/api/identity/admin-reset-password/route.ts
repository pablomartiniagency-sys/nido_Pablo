import { NextResponse } from "next/server";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: Request) {
  try {
    const { user_id, new_password } = await req.json();
    if (!user_id || !new_password || new_password.length < 6) {
      return NextResponse.json({ error: "user_id y new_password (min 6 chars) requeridos" }, { status: 400, headers: cors });
    }

    const admin = getIdentityAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Identity admin no configurado" }, { status: 500, headers: cors });
    }

    const { data, error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    }

    return NextResponse.json({ success: true, email: data.user.email }, { headers: cors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500, headers: cors });
  }
}
