import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

const DESTINO = "pablomartiniagency@gmail.com";

async function sendSmtp(data: { name: string; email: string; phone?: string; center?: string; message?: string }) {
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!smtpConfigured) return false;
  const result = await sendContactEmail(data);
  return result.sent;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, center, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email requeridos" }, { status: 400 });
    }

    // Intentar enviar email siempre
    const enviado = await sendSmtp({ name, email, phone, center, message });

    // Log detallado para que el dueño vea los leads aunque falle el email
    console.log("=== NUEVA SOLICITUD DEMO ===");
    console.log(`Nombre: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Teléfono: ${phone || "—"}`);
    console.log(`Centro: ${center || "—"}`);
    console.log(`Mensaje: ${message || "—"}`);
    console.log(`Email enviado a ${DESTINO}: ${enviado ? "SÍ" : "NO (SMTP no configurado en Netlify)"}`);
    console.log("============================");

    return NextResponse.json({
      success: true,
      message: "Solicitud recibida. Te contactaremos en 24h.",
      enviado,
    });
  } catch (err: any) {
    console.error("[Contact] Error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
