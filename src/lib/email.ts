import nodemailer from "nodemailer";

const DESTINO = "pablomartiniagency@gmail.com";

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  center?: string;
  message?: string;
}

export async function sendContactEmail(data: ContactData): Promise<{ sent: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log("[Email] SMTP no configurado. Datos recibidos:", JSON.stringify(data));
      // Log para desarrollo — se ve en la terminal de Netlify/Next.js
      return { sent: false, error: "SMTP_NOT_CONFIGURED" };
    }

    await transporter.sendMail({
      from: `"Nido Contacto" <${process.env.SMTP_USER}>`,
      to: DESTINO,
      subject: `Nuevo contacto desde Nido — ${data.name}`,
      html: `
        <h2>Nuevo contacto desde Nido</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Nombre</td><td style="padding:8px;border:1px solid #ddd">${data.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Teléfono</td><td style="padding:8px;border:1px solid #ddd">${data.phone}</td></tr>` : ""}
          ${data.center ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Centro</td><td style="padding:8px;border:1px solid #ddd">${data.center}</td></tr>` : ""}
          ${data.message ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mensaje</td><td style="padding:8px;border:1px solid #ddd">${data.message}</td></tr>` : ""}
        </table>
        <p style="color:#888;font-size:12px">Enviado desde Nido (${new Date().toLocaleString("es-ES")})</p>
      `,
    });

    return { sent: true };
  } catch (err: any) {
    console.error("[Email] Error sending:", err);
    return { sent: false, error: err.message };
  }
}

export async function sendNotificationEmail(subject: string, body: string, to?: string): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;
    await transporter.sendMail({
      from: `"Nido" <${process.env.SMTP_USER}>`,
      to: to || DESTINO,
      subject: `[Nido] ${subject}`,
      text: body,
    });
    return true;
  } catch {
    return false;
  }
}

export async function testEmailConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { ok: false, message: "SMTP no configurado. Revisa SMTP_HOST, SMTP_USER, SMTP_PASS en .env.local" };
    }
    await transporter.verify();
    return { ok: true, message: `Conexión SMTP exitosa. Los emails se envían a ${DESTINO}` };
  } catch (err: any) {
    return { ok: false, message: `Error SMTP: ${err.message || err}` };
  }
}
