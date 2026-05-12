import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { familiaNombre, familiaEmail, facturas, tipo } = body;

    if (!familiaEmail || !facturas?.length) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const totalPendiente = facturas.reduce((s: number, f: { total: number }) => s + f.total, 0);
  const listaFacturas = facturas.map((f: { numero: string; periodo: string; total: number }) =>
    `  • ${f.numero} — ${f.periodo} — ${f.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
  ).join("\n");

    const subject = tipo === "cortesia"
      ? `Recordatorio amable de pago — ${familiaNombre}`
      : `Aviso de impago — ${familiaNombre}`;

    const message = tipo === "cortesia"
      ? `Hola ${familiaNombre},\n\nTe recordamos que tienes las siguientes facturas pendientes de pago:\n\n${listaFacturas}\n\nTotal pendiente: ${totalPendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}\n\nPor favor, realiza el pago a la mayor brevedad.\n\nGracias,\nEquipo Nido`
      : `Hola ${familiaNombre},\n\nTe informamos que las siguientes facturas continúan sin ser pagadas:\n\n${listaFacturas}\n\nTotal pendiente: ${totalPendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}\n\nTe rogamos regularices tu situación lo antes posible para evitar recargos.\n\nAtentamente,\nEquipo Nido`;

    const sent = await sendNotificationEmail(subject, message, familiaEmail);
    if (!sent) {
      return NextResponse.json({ success: false, error: "SMTP no configurado o error al enviar. Revisa .env.local" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Recordatorio enviado a ${familiaEmail}` });
  } catch (err) {
    console.error("Error sending reminder:", err);
    return NextResponse.json({ error: "Error al enviar recordatorio" }, { status: 500 });
  }
}
