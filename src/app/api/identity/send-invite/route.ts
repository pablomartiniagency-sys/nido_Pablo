import { NextResponse } from "next/server";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: Request) {
  try {
    const { email, inviteLink, tenantName } = await req.json();
    if (!email || !inviteLink) {
      return NextResponse.json({ error: "email e inviteLink requeridos" }, { status: 400, headers: cors });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[Invite Email] SMTP no configurado. Enlace:", inviteLink);
      return NextResponse.json({ sent: false, link: inviteLink, warning: "SMTP no configurado" }, { headers: cors });
    }

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Nido Identity" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Invitación a ${tenantName} — Nido`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="font-size:24px;font-weight:bold;margin-bottom:16px">
            <span style="color:#1a1a2e">Nido</span><span style="color:#5c7cfa">Identity</span>
          </div>
          <p style="color:#333;margin-bottom:16px">Has sido invitado a <strong>${tenantName}</strong> como administrador.</p>
          <p style="color:#333;margin-bottom:20px">Haz clic en el botón para activar tu cuenta:</p>
          <a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#5c7cfa;color:white;text-decoration:none;border-radius:8px;font-weight:600">Aceptar invitación</a>
          <p style="color:#888;font-size:12px;margin-top:24px">Este enlace expira en 7 días. Si no esperabas esta invitación, ignora este mensaje.</p>
        </div>
      `,
    });

    return NextResponse.json({ sent: true }, { headers: cors });
  } catch (err: any) {
    console.error("[Invite Email] Error:", err);
    return NextResponse.json({ sent: false, link: null, error: err.message }, { headers: cors });
  }
}
