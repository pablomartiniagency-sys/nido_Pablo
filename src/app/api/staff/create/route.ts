import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MASTER_EMAIL = "pablomartiniagency@gmail.com";

export async function POST(req: Request) {
  try {
    const { email, password, name, ownerEmail } = await req.json();
    if (!email || !password || !name) return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    if (ownerEmail !== MASTER_EMAIL) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });

    const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: "staff", owner_email: MASTER_EMAIL },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email, name, role: "staff" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
