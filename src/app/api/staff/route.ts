import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MASTER_EMAIL = "pablomartiniagency@gmail.com";

function isOwner(req: Request): boolean {
  const ownerEmail = req.headers.get("x-owner-email");
  return ownerEmail === MASTER_EMAIL;
}

export async function DELETE(req: Request) {
  try {
    if (!isOwner(req)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isOwner(req)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { userId, password } = await req.json();
    if (!userId || !password) return NextResponse.json({ error: "userId y password requeridos" }, { status: 400 });

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await sb.auth.admin.updateUserById(userId, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Contraseña actualizada" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
