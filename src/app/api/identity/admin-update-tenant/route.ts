import { NextResponse } from "next/server";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: Request) {
  try {
    const { tenant_id, ...updates } = await req.json();
    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id requerido" }, { status: 400, headers: cors });
    }

    const allowed = ["name", "email", "nif", "phone", "plan", "status"];
    const clean: Record<string, any> = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) clean[key] = updates[key];
    }
    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400, headers: cors });
    }

    const admin = getIdentityAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Identity admin no configurado" }, { status: 500, headers: cors });
    }

    const { error } = await (admin.from("identity_tenants") as any).update(clean).eq("id", tenant_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
    }

    return NextResponse.json({ success: true }, { headers: cors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500, headers: cors });
  }
}
