import { NextResponse } from "next/server";

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

// ─── data helpers ──────────────────────────────────────────────
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

// ─── responder inteligente ─────────────────────────────────────
function responder(data: ChatRequest["data"], msg: string): string {
  const q = msg.toLowerCase();

  // --- saludo / agradecimiento ---
  if (/\b(hola|buenos días|buenas tardes|hey|saludos|qué tal|buenas)\b/.test(q))
    return responderSaludo(data);
  if (/\b(gracias|ok|vale|entendido|perfecto|de nada|súper|genial)\b/.test(q))
    return "¡De nada! Estoy aquí para lo que necesites. Pregúntame sobre alumnos, finanzas, facturas, empleados o leads cuando quieras.";

  // --- morosos / impagos ---
  if (/\b(moros|impag|pendiente.*pago|adeud|debe|debemos|sin pagar|no han pagado|factura.*pend|cuanto.*deb|qué.*deb|alerta.*pago|reclamación)\b/.test(q))
    return responderMorosos(data);

  // --- alumnos ---
  if (/\b(alumno|niño|niña|niños|niñas|estudiante|matricul|curso|clase|aula|baja|prematrícula|cuantos.*alum|cuantas.*famil)\b/.test(q))
    return responderAlumnos(data);

  // --- empleados / staff ---
  if (/\b(empleado|trabajador|profesor|educador|plantilla|contrat|nómina|sueldo|salario|cobran los|quien trabaja|personal|staff|maestr)\b/.test(q))
    return responderEmpleados(data);

  // --- gastos ---
  if (/\b(gasto|gastamos|coste|cuesta|proveedor|factura.*prov|dinero.*gast|cuanto.*gast|donde.*gast|en que.*gast|categoría.*gast|lista.*gast)\b/.test(q))
    return responderGastos(data);

  // --- ingresos / facturación ---
  if (/\b(ingreso|cobro|cobramos|cobrado|factur|cuota|mensualidad|cuanto.*ingres|cuanto.*cobr|dinero.*entr|beneficio|venta)\b/.test(q))
    return responderIngresos(data);

  // --- leads / oportunidades ---
  if (/\b(lead|oportunidad|comercial|cliente.*potenc|captación|venta|interesado|visita|matriculado|nuevo.*client|prospecto)\b/.test(q))
    return responderLeads(data);

  // --- incidencias / partes ---
  if (/\b(incidencia|parte|accidente|caída|fiebre|alergia|conflicto|problema|lesión|enferm|medic|urgenc|incident)\b/.test(q))
    return responderIncidencias(data);

  // --- financiero / EBITDA ---
  if (/\b(balance|resultado|pyg|perdi.*gananc|ebitda|rentabil|ratio|margen|cuen.*result|cómo.*finan|salud.*finan|estado.*finan)\b/.test(q))
    return responderFinanciero(data);

  // --- totales / sumas ---
  if (/\b(total|cuánto|suma|importe|valor|dame.*númer|resumen|panorama|vista general|situación)\b/.test(q))
    return responderGeneral(data);

  // --- preguntas sobre el centro / la escuela ---
  if (/\b(escuela|centro|nido|cómo est|qué tal|situación.*actu|dime|cuéntame|informe|qué pasa|novedades|qué hay)\b/.test(q))
    return responderCentro(data);

  // --- capacidad / plazas ---
  if (/\b(plaza|cupo|capacidad|ratio|admis|list.*espera|completo|hueco)\b/.test(q))
    return responderCapacidad(data);

  // --- preguntas sobre datos específicos ---
  if (/\b(cuántos|cuantos|qué|quién|dónde|cuándo|como|muestra|lista|dime|enseñame|muéstrame|dame)\b/.test(q))
    return responderExplorar(data, q);

  // --- cualquier otra cosa por defecto → respuesta útil ---
  return responderGeneral(data);
}

function responderSaludo(data: ChatRequest["data"]): string {
  const a = alumnosActivos(data).length;
  const e = empleadosActivos(data).length;
  const f = data.familias.length;
  return `¡Hola! 👋 Soy el asistente de Nido.\n\n` +
    `Aquí tienes un vistazo rápido:\n` +
    `• 🎓 **${a} alumnos** activos | **${e} empleados** | **${f} familias**\n` +
    `• 💰 Facturado: **${formatCurrency(totalFacturado(data.facturas))}**\n` +
    `• 📊 Pendiente: **${formatCurrency(pendiente(data.facturas))}**\n` +
    `• ⚠️ ${impagos(data.facturas).length} familias en impago\n\n` +
    `Pregúntame lo que quieras: alumnos, finanzas, empleados, facturas, incidencias... ¡lo que necesites!`;
}

function responderMorosos(data: ChatRequest["data"]): string {
  const imp = impagos(data.facturas);
  const pend = data.facturas.filter((f: any) => f.estado === "enviada");
  const totalImpago = imp.reduce((s: number, f: any) => s + f.total, 0);
  const totalPendiente = pend.reduce((s: number, f: any) => s + f.total, 0);

  if (imp.length === 0 && pend.length === 0)
    return "✅ No hay ninguna factura pendiente ni impagada. ¡Todo al día!";

  let resp = "";
  if (imp.length > 0) {
    resp += `⚠️ **${imp.length} ${imp.length === 1 ? "familia" : "familias"}** con facturas impagadas por **${formatCurrency(totalImpago)}**:\n\n`;
    imp.forEach((f: any) => {
      const fam = data.familias.find((fa: any) => fa.id === f.familiaId);
      resp += `• ${fam?.nombre || "Desconocido"} — ${f.numero} — ${formatCurrency(f.total)} (${f.diasImpago || "?"} días)\n`;
    });
  }
  if (pend.length > 0) {
    resp += `\n📄 **${pend.length} facturas** pendientes de cobro por **${formatCurrency(totalPendiente)}**:\n\n`;
    pend.forEach((f: any) => {
      const fam = data.familias.find((fa: any) => fa.id === f.familiaId);
      resp += `• ${fam?.nombre || "Desconocido"} — ${f.numero} — ${formatCurrency(f.total)}\n`;
    });
  }
  resp += "\n💡 Puedes enviar recordatorios desde la sección **Recordatorios** del menú.";
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
    if (premat > 0) resp += `• Pre-matrícula: ${premat}\n`;
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
    resp += `**Por categoría:**\n`;
    const sorted = Object.entries(porCategoria).sort(([, a], [, b]) => b - a);
    for (const [cat, imp] of sorted) {
      const pct = ((imp / total) * 100).toFixed(1);
      resp += `• ${cat}: ${formatCurrency(imp)} (${pct}%)\n`;
    }
  } else {
    resp += "No hay gastos registrados aún.";
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
      resp += `\n**Top familias por facturación:**\n`;
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
      resp += `\n**Por fuente de captación:**\n`;
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
    : "⚠️ La escuela está en pérdidas. Revisa gastos.";

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
    `💡 Pregúntame por: **alumnos, empleados, gastos, ingresos, morosos, leads, incidencias** o lo que necesites.`;
}

function responderCentro(data: ChatRequest["data"]): string {
  return responderGeneral(data);
}

function responderCapacidad(data: ChatRequest["data"]): string {
  const activos = alumnosActivos(data).length;
  const total = data.alumnos.length;
  return `📋 **Capacidad del centro**\n\n` +
    `• Alumnos activos: **${activos}**\n` +
    `• Alumnos totales (incl. prematrícula): **${total}**\n` +
    `• Familias: **${data.familias.length}**\n` +
    `• Empleados: **${empleadosActivos(data).length}**\n\n` +
    `Para más detalle, pregúntame por alumnos o empleados.`;
}

function responderExplorar(data: ChatRequest["data"], q: string): string {
  // Si pregunta "cuántos alumnos", "qué empleados", etc. → responde con datos
  if (/\b(alumno|niño|niña)\b/.test(q)) return responderAlumnos(data);
  if (/\b(empleado|trabajador|profesor)\b/.test(q)) return responderEmpleados(data);
  if (/\b(familia|padre|madre|tutor)\b/.test(q)) {
    const f = data.familias;
    let resp = `👨‍👩‍👧‍👦 **${f.length} familias** registradas:\n\n`;
    f.slice(0, 10).forEach((fam: any) => {
      resp += `• ${fam.nombre} (${fam.alumnos?.length || 0} hijos) — ${fam.email}\n`;
    });
    if (f.length > 10) resp += `\n... y ${f.length - 10} más.`;
    return resp;
  }
  if (/\b(factur|cuota|pago|recibo)\b/.test(q)) return responderIngresos(data);
  if (/\b(gasto|coste)\b/.test(q)) return responderGastos(data);
  if (/\b(lead|oportunidad)\b/.test(q)) return responderLeads(data);
  if (/\b(incidencia|parte)\b/.test(q)) return responderIncidencias(data);

  return responderGeneral(data);
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { message, data } = body;

    if (!message || !data) {
      return NextResponse.json({ error: "Mensaje y datos requeridos" }, { status: 400 });
    }

    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

    const respuesta = responder(data, message);

    return NextResponse.json({ reply: respuesta });
  } catch (err: any) {
    console.error("[Chat] Error:", err);
    return NextResponse.json({ error: "Error interno del asistente" }, { status: 500 });
  }
}
