import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, center, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (!smtpConfigured) {
      console.log("[Contact] SMTP no configurado. Lead recibido:", { name, email, phone, center, message });
      return NextResponse.json({
        success: true,
        message: "Solicitud recibida. Te contactaremos en 24h.",
        _debug: "SMTP_NO_CONFIGURADO — edita .env.local con SMTP_PASS válido (App Password de 16 caracteres)",
      });
    }

    const result = await sendContactEmail({ name, email, phone, center, message });

    if (result.sent) {
      return NextResponse.json({ success: true, message: "Mensaje enviado correctamente" });
    }

    console.error("[Contact] Error SMTP:", result.error);
    return NextResponse.json({
      success: false,
      error: `Error al enviar email: ${result.error}. Verifica que SMTP_PASS en .env.local es un App Password válido de 16 caracteres.`,
    });
  } catch (err: any) {
    console.error("[Contact] Error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
