import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

let anthropicClient: Anthropic | null = null;
function getAnthropic() {
  if (!anthropicClient && ANTHROPIC_KEY) anthropicClient = new Anthropic({ apiKey: ANTHROPIC_KEY });
  return anthropicClient;
}

interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  data: {
    familias: any[];
    facturas: any[];
    gastos: any[];
    empleados: any[];
    alumnos: any[];
    leads: any[];
    incidencias: any[];
  };
}

function formatCurrency(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function totalFacturado(facturas: any[]) {
  return facturas.reduce((s: number, f: any) => s + (f.total || 0), 0);
}
function cobrado(facturas: any[]) {
  return facturas.filter((f: any) => f.estado === "pagada").reduce((s: number, f: any) => s + (f.total || 0), 0);
}
function pendiente(facturas: any[]) {
  return facturas.filter((f: any) => f.estado === "enviada" || f.estado === "impago").reduce((s: number, f: any) => s + (f.total || 0), 0);
}
function impagos(facturas: any[]) {
  return facturas.filter((f: any) => f.estado === "impago");
}
function ingresos(data: ChatRequest["data"]) {
  return cobrado(data.facturas);
}
function gastosTotales(data: ChatRequest["data"]) {
  return data.gastos.reduce((s: number, g: any) => s + (g.importe || 0), 0);
}
function empleadosActivos(data: ChatRequest["data"]) {
  return data.empleados.filter((e: any) => e.activo !== false);
}
function alumnosActivos(data: ChatRequest["data"]) {
  return data.alumnos.filter((a: any) => a.estado === "activo");
}

// Busca cualquier palabra clave en el texto (coincidencia parcial, sin \b final para permitir plurales)
function contains(q: string, ...words: string[]) {
  return words.some(w => q.includes(w));
}

function responder(data: ChatRequest["data"], msg: string): string {
  const q = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // sin acentos para matching

  // --- saludo ---
  if (contains(q, "hola", "buenos dias", "buenas tardes", "buenas", "hey", "saludos", "que tal"))
    return responderSaludo(data);

  // --- agradecimiento ---
  if (contains(q, "gracias", "ok", "vale", "entendido", "perfecto", "de nada", "super", "genial"))
    return "¡De nada! Estoy aquí para lo que necesites. Pregúntame sobre alumnos, finanzas, facturas, empleados o leads cuando quieras.";

  // --- morosos / impagos ---
  if (contains(q, "moroso", "impago", "impagada", "adeuda", "debe", "debemos", "sin pagar", "no han pagado", "pendiente de pago", "alerta de pago", "reclamacion", "factura pendiente"))
    return responderMorosos(data);

  // --- alumnos ---
  if (contains(q, "alumno", "alumna", "alumnos", "alumnas", "nino", "nina", "ninos", "ninas", "estudiante", "matricula", "matriculado", "matriculados", "curso", "clase", "aula", "baja", "prematricula", "cuantos alum"))
    return responderAlumnos(data);

  // --- empleados / staff ---
  if (contains(q, "empleado", "empleados", "trabajador", "trabajadores", "profesor", "profesores", "educador", "educadores", "plantilla", "contratado", "contratados", "nomina", "nominas", "sueldo", "salario", "personal", "staff", "maestro", "maestros", "quien trabaja"))
    return responderEmpleados(data);

  // --- gastos ---
  if (contains(q, "gasto", "gastos", "gastamos", "coste", "cuesta", "proveedor", "proveedores", "dinero gast", "cuanto gast", "donde gast", "categoria gast", "lista gast", "factura de proveedor"))
    return responderGastos(data);

  // --- ingresos / facturacion ---
  if (contains(q, "ingreso", "ingresos", "cobro", "cobros", "cobramos", "cobrado", "factura", "facturacion", "facturado", "cuota", "mensualidad", "cuanto ingres", "cuanto cobr", "dinero entr", "beneficio", "venta"))
    return responderIngresos(data);

  // --- leads / oportunidades ---
  if (contains(q, "lead", "leads", "oportunidad", "oportunidades", "comercial", "cliente potencial", "captacion", "interesado", "visita", "matriculado", "nuevo cliente", "prospecto"))
    return responderLeads(data);

  // --- incidencias / partes ---
  if (contains(q, "incidencia", "incidencias", "parte", "partes", "accidente", "caida", "fiebre", "alergia", "alergias", "conflicto", "problema", "problemas", "lesion", "enfermo", "enferma", "medicina", "urgencia", "incidente"))
    return responderIncidencias(data);

  // --- financiero / EBITDA ---
  if (contains(q, "balance", "resultado", "pyg", "perdida", "ganancia", "ebitda", "rentabilidad", "rentable", "ratio", "margen", "salud financiera", "estado financiero"))
    return responderFinanciero(data);

  // --- totales / resumen ---
  if (contains(q, "total", "totales", "cuanto", "suma", "importe", "valor", "dame numero", "resumen", "panorama", "vista general", "situacion"))
    return responderGeneral(data);

  // --- preguntas sobre el centro ---
  if (contains(q, "escuela", "centro", "nido", "como est", "informe", "que pasa", "novedades", "que hay", "cuentame", "dime"))
    return responderCentro(data);

  // --- capacidad / plazas ---
  if (contains(q, "plaza", "plazas", "cupo", "capacidad", "ratio", "admision", "lista de espera", "completo", "hueco"))
    return responderCapacidad(data);

  // --- preguntas exploratorias ---
  if (contains(q, "cuantos", "cuantas", "que", "quien", "donde", "cuando", "como", "muestra", "lista", "dime", "enseñame", "muestrame", "dame"))
    return responderExplorar(data, q);

  return responderGeneral(data);
}

function responderSaludo(data: ChatRequest["data"]): string {
  const a = alumnosActivos(data).length;
  const e = empleadosActivos(data).length;
  const f = data.familias.length;
  return `¡Hola! 👋 Soy el asistente de Nido.\n\n` +
    `Aqui tienes un vistazo rapido:\n` +
    `• 🎓 **${a} alumnos** activos | **${e} empleados** | **${f} familias**\n` +
    `• 💰 Facturado: **${formatCurrency(totalFacturado(data.facturas))}**\n` +
    `• 📊 Pendiente: **${formatCurrency(pendiente(data.facturas))}**\n` +
    `• ⚠️ ${impagos(data.facturas).length} familias en impago\n\n` +
    `Preguntame lo que quieras: alumnos, finanzas, empleados, facturas, incidencias...`;
}

function responderMorosos(data: ChatRequest["data"]): string {
  const imp = impagos(data.facturas);
  const pend = data.facturas.filter((f: any) => f.estado === "enviada");
  const totalImpago = imp.reduce((s: number, f: any) => s + f.total, 0);
  const totalPendiente = pend.reduce((s: number, f: any) => s + f.total, 0);

  if (imp.length === 0 && pend.length === 0)
    return "✅ No hay ninguna factura pendiente ni impagada. ¡Todo al dia!";

  let resp = "";
  if (imp.length > 0) {
    resp += `⚠️ **${imp.length} ${imp.length === 1 ? "familia" : "familias"}** con facturas impagadas por **${formatCurrency(totalImpago)}**:\n\n`;
    imp.forEach((f: any) => {
      const fam = data.familias.find((fa: any) => fa.id === f.familiaId);
      resp += `• ${fam?.nombre || "Desconocido"} — ${f.numero} — ${formatCurrency(f.total)} (${f.diasImpago || "?"} dias)\n`;
    });
  }
  if (pend.length > 0) {
    resp += `\n📄 **${pend.length} facturas** pendientes de cobro por **${formatCurrency(totalPendiente)}**:\n\n`;
    pend.forEach((f: any) => {
      const fam = data.familias.find((fa: any) => fa.id === f.familiaId);
      resp += `• ${fam?.nombre || "Desconocido"} — ${f.numero} — ${formatCurrency(f.total)}\n`;
    });
  }
  resp += "\n💡 Puedes enviar recordatorios desde la seccion **Recordatorios** del menu.";
  return resp;
}

function responderAlumnos(data: ChatRequest["data"]): string {
  const total = data.alumnos.length;
  const activos = alumnosActivos(data).length;
  const porCurso: Record<string, number> = {};
  data.alumnos.forEach((a: any) => { porCurso[a.curso] = (porCurso[a.curso] || 0) + 1; });

  let resp = `🎓 **${total} alumnos** en total (${activos} activos)\n\n**Por curso:**\n`;
  for (const [curso, count] of Object.entries(porCurso)) {
    resp += `• ${curso}: ${count}\n`;
  }
  const bajas = data.alumnos.filter((a: any) => a.estado === "baja").length;
  const premat = data.alumnos.filter((a: any) => a.estado === "prematricula").length;
  if (premat > 0 || bajas > 0) {
    resp += `\n**Estado:**\n`;
    if (premat > 0) resp += `• Pre-matricula: ${premat}\n`;
    if (bajas > 0) resp += `• Bajas: ${bajas}\n`;
  }
  const alergias = data.alumnos.filter((a: any) => a.alergias?.length > 0);
  if (alergias.length > 0) {
    resp += `\n⚠️ **${alergias.length} alumnos** con alergias registradas.`;
  }
  return resp;
}

function responderEmpleados(data: ChatRequest["data"]): string {
  const activos = empleadosActivos(data);
  const totalNomina = activos.reduce((s: number, e: any) => s + (e.salarioBrutoMensual || 0), 0);

  let resp = `👥 **${activos.length} empleados activos**\n`;
  resp += `💰 Masa salarial: **${formatCurrency(totalNomina)}/mes**\n\n`;
  const porPuesto: Record<string, number> = {};
  activos.forEach((e: any) => { porPuesto[e.puesto] = (porPuesto[e.puesto] || 0) + 1; });
  if (Object.keys(porPuesto).length > 0) {
    resp += `**Por puesto:**\n`;
    for (const [puesto, count] of Object.entries(porPuesto)) {
      resp += `• ${puesto}: ${count}\n`;
    }
  }
  return resp;
}

function responderGastos(data: ChatRequest["data"]): string {
  const total = gastosTotales(data);
  const porCategoria: Record<string, number> = {};
  data.gastos.forEach((g: any) => { porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + (g.importe || 0); });

  let resp = `📊 **Gastos totales:** ${formatCurrency(total)}\n\n`;
  if (Object.keys(porCategoria).length > 0) {
    resp += `**Por categoria:**\n`;
    const sorted = Object.entries(porCategoria).sort(([, a], [, b]) => b - a);
    for (const [cat, imp] of sorted) {
      const pct = ((imp / total) * 100).toFixed(1);
      resp += `• ${cat}: ${formatCurrency(imp)} (${pct}%)\n`;
    }
  } else {
    resp += "No hay gastos registrados aun.";
  }
  return resp;
}

function responderIngresos(data: ChatRequest["data"]): string {
  const cob = cobrado(data.facturas);
  const pend = pendiente(data.facturas);
  const tf = totalFacturado(data.facturas);

  let resp = `💰 **Total facturado:** ${formatCurrency(tf)}\n`;
  resp += `✅ **Cobrado:** ${formatCurrency(cob)}\n`;
  resp += `⏳ **Pendiente:** ${formatCurrency(pend)}\n`;

  if (data.facturas.length > 0) {
    const porFamilia: Record<string, number> = {};
    data.facturas.forEach((f: any) => { porFamilia[f.familia] = (porFamilia[f.familia] || 0) + (f.total || 0); });
    const sorted = Object.entries(porFamilia).sort(([, a], [, b]) => b - a).slice(0, 5);
    if (sorted.length > 0) {
      resp += `\n**Top familias por facturacion:**\n`;
      for (const [fam, imp] of sorted) {
        resp += `• ${fam}: ${formatCurrency(imp)}\n`;
      }
    }
  }
  return resp;
}

function responderLeads(data: ChatRequest["data"]): string {
  const total = data.leads.length;
  const nuevos = data.leads.filter((l: any) => l.estado === "nuevo").length;
  const visitas = data.leads.filter((l: any) => /visita/.test(l.estado)).length;
  const matriculados = data.leads.filter((l: any) => l.estado === "matriculado").length;

  let resp = `📈 **${total} leads** en total\n\n`;
  resp += `• 🆕 Nuevos: ${nuevos}\n`;
  resp += `• 👀 Visitas: ${visitas}\n`;
  resp += `• ✅ Matriculados: ${matriculados}\n`;

  if (data.leads.length > 0) {
    const porFuente: Record<string, number> = {};
    data.leads.forEach((l: any) => { porFuente[l.fuente] = (porFuente[l.fuente] || 0) + 1; });
    if (Object.keys(porFuente).length > 0) {
      resp += `\n**Por fuente de captacion:**\n`;
      for (const [fuente, count] of Object.entries(porFuente)) {
        resp += `• ${fuente}: ${count}\n`;
      }
    }
  }
  return resp;
}

function responderIncidencias(data: ChatRequest["data"]): string {
  const abiertas = data.incidencias.filter((i: any) => !i.resuelta);
  const total = data.incidencias.length;

  if (total === 0) return "✅ No hay incidencias registradas.";

  let resp = `🚨 **${abiertas.length} incidencias abiertas** de ${total} totales\n\n`;
  if (abiertas.length > 0) {
    abiertas.forEach((i: any) => {
      resp += `• ${i.alumno || "Alumno"}: ${i.descripcion} (${i.gravedad})\n`;
    });
  }
  return resp;
}

function responderFinanciero(data: ChatRequest["data"]): string {
  const ing = ingresos(data);
  const gas = gastosTotales(data);
  const ebitda = ing - gas;
  const margen = ing > 0 ? ((ebitda / ing) * 100).toFixed(1) : "0";

  let resp = `📊 **Resumen financiero**\n\n`;
  resp += `📈 Ingresos (cobrado): **${formatCurrency(ing)}**\n`;
  resp += `📉 Gastos: **${formatCurrency(gas)}**\n`;
  resp += `📊 EBITDA: **${formatCurrency(ebitda)}** (margen: ${margen}%)\n\n`;
  resp += ebitda > 0
    ? "✅ La escuela es rentable."
    : "⚠️ La escuela esta en perdidas. Revisa gastos.";

  const mor = impagos(data.facturas).length;
  if (mor > 0) resp += `\n\n⚠️ ${mor} ${mor === 1 ? "familia" : "familias"} en morosidad.`;
  return resp;
}

function responderGeneral(data: ChatRequest["data"]): string {
  const numFamilias = data.familias.length;
  const numAlumnos = data.alumnos.length;
  const numEmpleados = empleadosActivos(data).length;
  const tf = totalFacturado(data.facturas);
  const cob = cobrado(data.facturas);
  const gas = gastosTotales(data);
  const mor = impagos(data.facturas).length;

  return `📋 **Resumen general de la escuela**\n\n` +
    `🏫 **${numFamilias} familias** | 🎓 **${numAlumnos} alumnos** | 👥 **${numEmpleados} empleados**\n\n` +
    `💰 **Facturado:** ${formatCurrency(tf)}\n` +
    `✅ **Cobrado:** ${formatCurrency(cob)}\n` +
    `📊 **Pendiente:** ${formatCurrency(tf - cob)}\n` +
    `📉 **Gastos:** ${formatCurrency(gas)}\n` +
    `${mor > 0 ? `⚠️ **${mor} ${mor === 1 ? "familia" : "familias"}** en impago\n` : ""}\n` +
    `💡 Preguntame por: **alumnos, empleados, gastos, ingresos, morosos, leads, incidencias** o lo que necesites.`;
}

function responderCentro(data: ChatRequest["data"]): string {
  return responderGeneral(data);
}

function responderCapacidad(data: ChatRequest["data"]): string {
  const activos = alumnosActivos(data).length;
  const total = data.alumnos.length;
  return `📋 **Capacidad del centro**\n\n` +
    `• Alumnos activos: **${activos}**\n` +
    `• Alumnos totales (incl. prematricula): **${total}**\n` +
    `• Familias: **${data.familias.length}**\n` +
    `• Empleados: **${empleadosActivos(data).length}**\n\n` +
    `Para mas detalle, preguntame por alumnos o empleados.`;
}

function responderExplorar(data: ChatRequest["data"], q: string): string {
  if (q.includes("alumno") || q.includes("nino") || q.includes("nina")) return responderAlumnos(data);
  if (q.includes("empleado") || q.includes("trabajador") || q.includes("profesor")) return responderEmpleados(data);
  if (q.includes("familia") || q.includes("padre") || q.includes("madre") || q.includes("tutor")) {
    const f = data.familias;
    let resp = `👨‍👩‍👧‍👦 **${f.length} familias** registradas:\n\n`;
    f.slice(0, 10).forEach((fam: any) => {
      resp += `• ${fam.nombre} (${fam.alumnos?.length || 0} hijos) — ${fam.email}\n`;
    });
    if (f.length > 10) resp += `\n... y ${f.length - 10} mas.`;
    return resp;
  }
  if (q.includes("factura") || q.includes("cuota") || q.includes("pago") || q.includes("recibo")) return responderIngresos(data);
  if (q.includes("gasto") || q.includes("coste")) return responderGastos(data);
  if (q.includes("lead") || q.includes("oportunidad")) return responderLeads(data);
  if (q.includes("incidencia") || q.includes("parte")) return responderIncidencias(data);

  return responderGeneral(data);
}

function buildSystemPrompt(data: ChatRequest["data"]): string {
  const totalFam = data.familias.length;
  const totalFac = data.facturas.length;
  const totalGas = data.gastos.length;
  const totalEmp = data.empleados.length;
  const totalAlu = data.alumnos.length;
  const totalLea = data.leads.length;
  const totalInc = data.incidencias.length;
  const cobradoTotal = data.facturas.filter((f: any) => f.estado === "pagada").reduce((s: number, f: any) => s + (f.total || 0), 0);
  const pendienteTotal = data.facturas.filter((f: any) => f.estado === "enviada" || f.estado === "impago").reduce((s: number, f: any) => s + (f.total || 0), 0);

  return `Eres Nido, el asistente IA de una secretaría digital para escuelas infantiles (0-3 años).
Respondes preguntas sobre los datos de la escuela en español, con tono cercano y profesional.

DATOS ACTUALES DE LA ESCUELA:
- ${totalFam} familias registradas
- ${totalFac} facturas (${cobradoTotal.toLocaleString("es-ES", {style:"currency",currency:"EUR"})} cobrado, ${pendienteTotal.toLocaleString("es-ES",{style:"currency",currency:"EUR"})} pendiente)
- ${totalGas} gastos registrados
- ${totalEmp} empleados
- ${totalAlu} alumnos
- ${totalLea} leads / oportunidades
- ${totalInc} incidencias registradas

Reglas:
1. Responde SIEMPRE basándote en los datos proporcionados, no inventes cifras.
2. Si te preguntan algo fuera del contexto escolar, redirige amablemente.
3. Usa un formato claro: negritas para cifras, emojis moderados, párrafos cortos.
4. Ofrece sugerencias útiles cuando sea relevante (ej: "Puedes crear una campaña de marketing para recuperar leads perdidos").
5. Si no tienes datos suficientes para responder, dilo honestamente.`;
}

async function responderConGroq(message: string, history: { role: string; content: string }[], data: ChatRequest["data"]): Promise<string | null> {
  if (!GROQ_KEY) return null;
  const systemPrompt = buildSystemPrompt(data);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) { console.warn("[Chat] Groq error:", res.status); return null; }
    const json = await res.json();
    return json.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.warn("[Chat] Groq API error:", err?.message?.slice(0, 200));
    return null;
  }
}

async function responderConLLM(message: string, history: { role: string; content: string }[], data: ChatRequest["data"]): Promise<string | null> {
  const client = getAnthropic();
  if (client) {
    try {
      const systemPrompt = buildSystemPrompt(data);
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history.slice(-10).map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: message },
        ],
      });
      const block = msg.content.find((c: any) => c.type === "text") as any;
      if (block?.text) return block.text;
    } catch (err: any) {
      console.warn("[Chat] Anthropic API error:", err?.message?.slice(0, 200));
    }
  }

  const groqReply = await responderConGroq(message, history, data);
  if (groqReply) return groqReply;

  return null;
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history, data } = body;

    if (!message || !data) {
      return NextResponse.json({ error: "Mensaje y datos requeridos" }, { status: 400 });
    }

    // Try LLM first, fall back to rule-based
    const llmReply = await responderConLLM(message, history || [], data);
    if (llmReply) {
      return NextResponse.json({ reply: llmReply, source: "llm" });
    }

    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

    const respuesta = responder(data, message);

    return NextResponse.json({ reply: respuesta, source: "rules" });
  } catch (err: any) {
    console.error("[Chat] Error:", err);
    return NextResponse.json({ error: "Error interno del asistente" }, { status: 500 });
  }
}
