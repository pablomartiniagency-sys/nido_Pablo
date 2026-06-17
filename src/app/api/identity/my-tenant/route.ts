import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const identityUrl = process.env.NEXT_PUBLIC_IDENTITY_SUPABASE_URL;
    const identityAnonKey = process.env.NEXT_PUBLIC_IDENTITY_SUPABASE_ANON_KEY;
    if (!identityUrl || !identityAnonKey) {
      return NextResponse.json({ error: "Identity no configurado" }, { status: 500 });
    }

    const supabase = createClient(identityUrl, identityAnonKey);
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: userErr?.message || "Token inválido" }, { status: 401 });
    }

    const { data: tu, error: tuErr } = await supabase.from("identity_tenant_users").select("tenant_id,role").eq("user_id", user.id).maybeSingle();
    if (tuErr || !tu) {
      return NextResponse.json({ error: tuErr?.message || "No tienes un centro asignado" }, { status: 403 });
    }

    const { data: ten, error: tenErr } = await supabase.from("identity_tenants").select("id,name,stripe_customer_id,stripe_subscription_id,subscription_status,plan,created_at,updated_at").eq("id", tu.tenant_id).maybeSingle();

    return NextResponse.json({ tenant: ten || null, role: tu.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
