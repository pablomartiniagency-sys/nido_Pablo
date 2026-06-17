import { NextRequest, NextResponse } from "next/server";

const TO_EMAIL = "pablomartiniagency@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, center, message } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Nombre y email requeridos" }, { status: 400 });
    }

    let enviado = false;

    if (process.env.SMTP_HOST && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"Nido Demo" <${process.env.SMTP_USER}>`,
          to: TO_EMAIL,
          subject: `Nueva solicitud demo — ${name}`,
          html: `<p><strong>Nombre:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Teléfono:</strong> ${phone || "-"}</p>
<p><strong>Centro:</strong> ${center || "-"}</p>
<p><strong>Mensaje:</strong> ${message || "-"}</p>`,
        });
        enviado = true;
      } catch {
        enviado = false;
      }
    }

    return NextResponse.json({ success: true, enviado });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
