import { NextResponse } from "next/server";

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { familiaNombre, familiaEmail, facturas, cargos, tipo } = body;

    if (!familiaNombre || !facturas?.length) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const totalPendiente = facturas.reduce((s: number, f: { total: number }) => s + f.total, 0);

    const listaFacturas = facturas.map((f: { numero: string; periodo: string; total: number }) =>
      `  • Factura ${f.numero} — ${f.periodo} — ${f.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
    ).join("\n");

    const listaCargos = cargos?.length
      ? cargos.map((c: { alumnoNombre: string; concepto: string; importe: number }) =>
          `  • ${c.alumnoNombre} — ${c.concepto} — ${c.importe.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`
        ).join("\n")
      : "";

    const tono = tipo === "cortesia" ? "amable y cercano, como un recordatorio cordial" : "firme pero respetuoso, notificando un impago";

    const prompt = `Eres el asistente administrativo de una escuela infantil llamada "Nido". Redacta un email de recordatorio de pago en español para la familia "${familiaNombre}".

Tono: ${tono}.

Facturas pendientes:
${listaFacturas}
${listaCargos ? `\nCargos pendientes:\n${listaCargos}` : ""}

Total pendiente: ${totalPendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}

Requisitos:
- Asunto: líneas de asunto sugeridas (2-3 opciones)
- Cuerpo del email en español, profesional pero cercano
- Incluir el total pendiente
- Despedida cordial
- Firmado como "Equipo Nido"

Devuelve SOLO un JSON con este formato exacto (sin markdown, solo JSON):
{
  "asunto": "el mejor asunto",
  "cuerpo": "cuerpo del email completo"
}`;

    let draft = null;

    if (GROQ_KEY) {
      try {
        const res = await fetch(GROQ_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: GROQ_MODEL,
            max_tokens: 1024,
            temperature: 0.7,
            messages: [{ role: "system", content: "Eres un asistente útil que genera emails profesionales. Siempre respondes con JSON válido." }, { role: "user", content: prompt }],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const raw = json.choices?.[0]?.message?.content || "";
          const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
          draft = { asunto: parsed.asunto || parsed.subject || "", cuerpo: parsed.cuerpo || parsed.body || "" };
        }
      } catch { }
    }

    if (!draft) {
      const asunto = tipo === "cortesia"
        ? `Recordatorio amable de pago — ${familiaNombre}`
        : `Aviso de impago — ${familiaNombre}`;
      const cuerpo = tipo === "cortesia"
        ? `Hola ${familiaNombre},\n\nTe recordamos que tienes las siguientes facturas pendientes de pago:\n\n${listaFacturas}${listaCargos ? `\n${listaCargos}` : ""}\n\nTotal pendiente: ${totalPendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}\n\nPor favor, realiza el pago a la mayor brevedad.\n\nGracias,\nEquipo Nido`
        : `Hola ${familiaNombre},\n\nTe informamos que las siguientes facturas continúan sin ser pagadas:\n\n${listaFacturas}${listaCargos ? `\n${listaCargos}` : ""}\n\nTotal pendiente: ${totalPendiente.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}\n\nTe rogamos regularices tu situación lo antes posible.\n\nAtentamente,\nEquipo Nido`;
      draft = { asunto, cuerpo };
    }

    return NextResponse.json({ success: true, draft });
  } catch (err) {
    console.error("Error generating draft:", err);
    return NextResponse.json({ error: "Error al generar borrador" }, { status: 500 });
  }
}
