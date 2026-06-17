import { NextResponse } from "next/server";

const GROQ_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const report = await req.json();
    if (!GROQ_KEY) {
      return NextResponse.json(
        { analisis: generaAnalisisLocal(report) },
      );
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        messages: [
          { role: "system", content: `Eres un analista financiero experto en escuelas infantiles.
Analiza los datos financieros proporcionados y genera un informe en formato JSON con:
- "diagnostico": diagnóstico general de salud financiera (1-2 frases)
- "fortalezas": array de fortalezas
- "riesgos": array de riesgos detectados
- "recomendaciones": array de recomendaciones accionables
- "alertas": array de alertas críticas (vacío si no hay)
Responde ÚNICAMENTE con el JSON, sin markdown ni texto adicional.` },
          { role: "user", content: JSON.stringify(report) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    const analisis = JSON.parse(content);
    return NextResponse.json({ analisis });
  } catch (err: any) {
    console.warn("[AnalisisFinanciero] Error:", err?.message?.slice(0, 200));
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ analisis: generaAnalisisLocal(body) });
  }
}

function generaAnalisisLocal(report: any) {
  const { ingresosTotales, ingresosCobrados, gastosOperativos, ebitda, margenEbitda, liquidez, endeudamiento, rentabilidad } = report;
  const fortalezas: string[] = [];
  const riesgos: string[] = [];
  const recomendaciones: string[] = [];
  const alertas: string[] = [];

  if (margenEbitda > 15) {
    fortalezas.push(`Margen EBITDA del ${margenEbitda?.toFixed(1)}% — saludable y por encima del 15% recomendado`);
  } else {
    riesgos.push(`Margen EBITDA del ${margenEbitda?.toFixed(1)}% — por debajo del 15% recomendado en escuelas infantiles`);
    recomendaciones.push("Revisa gastos operativos o ajusta precios de mensualidades para mejorar el margen");
  }

  if (ebitda > 0) fortalezas.push("EBITDA positivo — la operativa genera valor");
  else alertas.push("EBITDA negativo — la escuela está operando en pérdidas");

  const pctCobrado = ingresosTotales > 0 ? ((ingresosCobrados / ingresosTotales) * 100).toFixed(1) : "0";
  if (Number(pctCobrado) > 80) fortalezas.push(`Alta tasa de cobro: ${pctCobrado}% de facturación cobrada`);
  else {
    riesgos.push(`Solo ${pctCobrado}% de facturación cobrada — alta exposición a impagos`);
    recomendaciones.push("Activa recordatorios automáticos de pago y considera recargos por demora");
  }

  if (endeudamiento > 0.5) {
    riesgos.push(`Endeudamiento del ${(endeudamiento * 100).toFixed(1)}% — por encima del 50% recomendado`);
    recomendaciones.push("Evita nuevas deudas y prioriza amortizar las existentes");
  } else if (endeudamiento > 0) {
    fortalezas.push(`Endeudamiento controlado: ${(endeudamiento * 100).toFixed(1)}%`);
  }

  if (liquidez < 1.5 && liquidez > 0) {
    riesgos.push(`Liquidez de ${liquidez.toFixed(2)} — por debajo de 1.5, riesgo de solvencia a corto plazo`);
    recomendaciones.push("Reduce plazo de cobro a familias o negocia pagos aplazados con proveedores");
  }

  if (rentabilidad > 10) fortalezas.push(`Rentabilidad neta del ${rentabilidad?.toFixed(1)}% — negocio rentable`);
  else if (rentabilidad > 0) riesgos.push(`Rentabilidad neta baja: ${rentabilidad?.toFixed(1)}%`);
  else alertas.push("Rentabilidad neta negativa — se están destruyendo recursos");

  return {
    diagnostico: fortalezas.length > riesgos.length + alertas.length
      ? "La escuela presenta una salud financiera aceptable con margen de mejora en áreas específicas."
      : "Se detectan desequilibrios financieros que requieren atención inmediata.",
    fortalezas: fortalezas.length ? fortalezas : ["No se identifican fortalezas significativas con los datos actuales"],
    riesgos: riesgos.length ? riesgos : ["No se detectan riesgos mayores"],
    recomendaciones: recomendaciones.length ? recomendaciones : ["Mantener las buenas prácticas actuales"],
    alertas,
  };
}
