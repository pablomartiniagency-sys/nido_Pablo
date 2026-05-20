import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { to, subject, body, tipo } = await req.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject y body son requeridos" }, { status: 400 });
    }

    if (tipo === "masivo" && Array.isArray(to)) {
      const results = await Promise.allSettled(
        to.map((dest: { email: string; nombre: string }) =>
          sendNotificationEmail(
            subject.replace("{nombre}", dest.nombre),
            body.replace("{nombre}", dest.nombre),
            dest.email,
          )
        )
      );
      const enviados = results.filter(r => r.status === "fulfilled" && r.value).length;
      return NextResponse.json({ success: true, enviados, total: to.length });
    }

    const ok = await sendNotificationEmail(subject, body, to);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
