import { NextResponse } from "next/server";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: Request) {
  try {
    const { token, name, password } = await req.json();
    if (!token || !name || !password || password.length < 6) {
      return NextResponse.json({ error: "token, name y password (min 6 chars) requeridos" }, { status: 400, headers: cors });
    }

    const admin = getIdentityAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Identity admin no configurado" }, { status: 500, headers: cors });
    }

    const { data: invitation, error: invErr } = await (admin
      .from("identity_invitations") as any)
      .select("id, tenant_id, email, role, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle();

    if (invErr || !invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404, headers: cors });
    }
    if (invitation.accepted_at) {
      return NextResponse.json({ error: "Invitación ya aceptada" }, { status: 400, headers: cors });
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invitación expirada" }, { status: 400, headers: cors });
    }

    const { data: authData, error: createErr } = await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createErr || !authData.user) {
      return NextResponse.json({ error: createErr?.message || "Error creando usuario" }, { status: 500, headers: cors });
    }

    const { error: linkErr } = await (admin.from("identity_tenant_users") as any).insert({
      tenant_id: invitation.tenant_id,
      user_id: authData.user.id,
      role: invitation.role,
      verified_at: new Date().toISOString(),
      email: invitation.email,
    });

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500, headers: cors });
    }

    const { error: acceptErr } = await (admin
      .from("identity_invitations") as any)
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (acceptErr) {
      return NextResponse.json({ error: acceptErr.message }, { status: 500, headers: cors });
    }

    return NextResponse.json({ success: true }, { headers: cors });
  } catch (err: any) {
    console.error("[Identity Accept] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500, headers: cors });
  }
}
