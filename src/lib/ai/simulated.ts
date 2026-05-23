import type { Gasto, Factura, SuministroFactura } from "@/types";

export async function ocrFactura() {
  await sleep(1600 + Math.random() * 800);
  const escenarios = [
    { proveedor:"Makro Cash & Carry", concepto:"Alimentación — pedido semanal comedor",
      importe:(280 + Math.random()*120).toFixed(2), iva:"21", categoria:"alimentacion",
      notas:"OCR: frutas, lácteos, pan, carne, verduras" },
    { proveedor:"Endesa", concepto:"Electricidad (periodo mensual)",
      importe:(170 + Math.random()*45).toFixed(2), iva:"21", categoria:"suministros",
      notas:"OCR: tarifa 2.0TD — 920 kWh estimados" },
    { proveedor:"Dideco Material Didáctico", concepto:"Material escolar primavera",
      importe:(120 + Math.random()*80).toFixed(2), iva:"21", categoria:"material",
      notas:"OCR: témperas, cartulinas, plastilina" },
  ];
  return escenarios[Math.floor(Math.random()*escenarios.length)];
}

export function clasificarGasto(proveedor: string, concepto = "") {
  const t = (proveedor + " " + concepto).toLowerCase();
  const reglas: Array<[RegExp,string]> = [
    [/\b(uniforme|babero|delantal|chándal|bata|mandil)\b/i, "material"],
    [/\b(comedor|cocina|menú|menu|catering|comida escolar|alimentación|alimentacion|makro|mercadona|carrefour|fruta|frutas|carnicer|panader|lácteo|lacteo|supermercado|alipende|gallo|arroz|pasta|aceite|legumbre|conserva|puré|pure|potito|merienda|desayuno|comida|leche|huevo)\b/i, "alimentacion"],
    [/\b(dideco|material|educativ|juguet|librer|papeler|didácti|didacti|escolar|cuaderno|rotulador|témpera|tempera|plastilina|arcilla|pegamento|tijera|folio|cartulina|gomets|ceras|lápiz|lapiz|manualidad|montessori|pintura dedos|pañal|toallita|crema cambio|protector solar|babero|uniforme|pedagógico|pedagogico|sensorial|psicomotricidad|estimulación|estimulacion)\b/i, "material"],
    [/\b(limpieza|higieniz|desinfec|lejía|lejia|detergente|jabón|jabon|estropajo|bayeta|fregasuelos|ambientador|cloro|alcohol|desinfectante|guante|bolsa basura|fregona|cubo|papel higiénico|papel higienico|toallita|químico|quimico)\b/i, "limpieza"],
    [/\b(endesa|iberdrola|naturgy|gas|luz|electricid|agua|movistar|vodafone|orange|internet|suministro|recibo|factura luz|factura gas)\b/i, "suministros"],
    [/\b(alquiler|arrendamien|hipotec|propietario)\b/i, "alquiler"],
    [/\b(asesor|gestor|fiscal|contab|abogad|notari)\b/i, "gestoria"],
    [/\b(seguro|axa|mapfre|allianz|rc|civil)\b/i, "seguros"],
    [/\b(nómina|personal|empleado|salario|seguridad social)\b/i, "personal"],
    [/\b(reparac|ferretería|manten|averí|fontanería|arreglo|obra|reforma)\b/i, "mantenimiento"],
    [/\b(google|facebook|ads|anuncio|marketing|publicidad|instagram|redes)\b/i, "marketing"],
    [/\b(formación|formacion|curso|congreso|jornada|taller|seminario|workshop|homologación|homologacion)\b/i, "formacion"],
    [/\b(transporte|taxi|uber|glovo|gasolinera|gasolina|parking|aparcamiento|tren|metro|autobús|autobus|bus)\b/i, "transporte"],
    [/\b(farmacia|medicamento|medicina|médico|medico|pediatra|enfermero|enfermera|hospital|clínica|clinica|vacuna|analítica|analitica|receta)\b/i, "salud"],
    [/\b(ocio|extraescolar|excursión|excursion|salida|cine|teatro|colonia|campamento|verano|parque)\b/i, "ocio"],
  ];
  for (const [re,cat] of reglas) if (re.test(t)) return cat;
  return "otros";
}

export function preverPagos(facturas: Factura[], gastos: Gasto[]) {
  const ingresosBase = facturas.reduce((s,f)=>s+f.total, 0);
  const fijos    = gastos.filter(g=>g.recurrencia==="mensual").reduce((s,g)=>s+g.importe, 0);
  const anuales  = gastos.filter(g=>g.recurrencia==="anual").reduce((s,g)=>s+g.importe, 0);
  const fijosMes = fijos + anuales/12;
  const variables = gastos.filter(g=>g.recurrencia==="puntual").reduce((s,g)=>s+g.importe, 0);
  const meses = ["Junio 2026","Julio 2026","Agosto 2026"];
  return meses.map((periodo,i) => {
    const fI = i===0?1: i===1?0.85: 0.55;
    const fV = i===2?0.6:1;
    const ie = Math.round(ingresosBase*fI);
    const gf = Math.round(fijosMes);
    const gv = Math.round(variables*fV);
    return { periodo, ingresosEsperados:ie, gastosFijos:gf, gastosVariables:gv,
             resultadoEstimado: ie - gf - gv };
  });
}

export function preverConsumo(hist: SuministroFactura[]) {
  if (hist.length < 3) return { proximoMes: hist.at(-1)?.importe ?? 0, tendencia:"estable" as const, recomendacion:"Datos insuficientes" };
  const ys = hist.map(h=>h.importe), xs = ys.map((_,i)=>i);
  const n = xs.length, sX=xs.reduce((a,b)=>a+b,0), sY=ys.reduce((a,b)=>a+b,0);
  const sXY = xs.reduce((s,x,i)=>s+x*ys[i],0), sXX = xs.reduce((s,x)=>s+x*x,0);
  const m = (n*sXY - sX*sY) / (n*sXX - sX*sX);
  const b = (sY - m*sX) / n;
  const proximo = m*n + b;
  const delta = (proximo - ys.at(-1)!) / ys.at(-1)!;
  const tendencia: "sube"|"baja"|"estable" = delta>0.05?"sube": delta<-0.05?"baja":"estable";
  const recomendacion = tendencia==="sube"
    ? "Considera revisar tarifa o auditar consumos."
    : tendencia==="baja"
    ? "Buen momento para renegociar tarifa más ajustada."
    : "Una comparativa podría ahorrar 10-15% adicional.";
  return { proximoMes: Math.max(0, Math.round(proximo)), tendencia, recomendacion };
}

export async function responderAsistente(pregunta: string, ctx: {
  morosos?:number; cobrado?:number; pendiente?:number; gastoMes?:number; resultado?:number;
}) {
  await sleep(700 + Math.random()*500);
  const q = pregunta.toLowerCase();
  if (/moros|impago/.test(q)) return `Tienes ${ctx.morosos??0} familias en impago. Sugiero recordatorio por WhatsApp y escalada en 72h.`;
  if (/cobrad|recib/.test(q)) return `Llevas cobrado ${ctx.cobrado??0}€ y ${ctx.pendiente??0}€ pendientes. ¿Genero la remesa SEPA?`;
  if (/gast|proveedor/.test(q)) return `Gasto del mes: ${ctx.gastoMes??0}€. Mayor partida: alimentación + suministros.`;
  if (/result|margen/.test(q)) return `Resultado estimado: ${ctx.resultado??0}€. Margen sano en escuelas: 12-18%.`;
  if (/nómin|salari/.test(q))  return `Bruto nóminas ~6.490€, coste con SS empresa ~8.470€. ¿SEPA de nóminas?`;
  if (/suministro|luz/.test(q)) return `Eléctrica lleva 5 meses bajando (261€→185€). Buen momento para renegociar.`;
  return `He registrado tu consulta. Con la API de Anthropic activa redactaré circulares y analizaré PDFs.`;
}

export function detectarAlertas(input: { facturas: Factura[]; gastos: Gasto[]; suministros: SuministroFactura[] }) {
  const out: Array<{tipo:"critica"|"aviso"|"info"; titulo:string; detalle:string; accion?:string}> = [];
  const impagos = input.facturas.filter(f=>f.estado==="impago");
  if (impagos.length) out.push({
    tipo: impagos.length>2 ? "critica" : "aviso",
    titulo: `${impagos.length} ${impagos.length===1?"familia":"familias"} en impago`,
    detalle: `Impacto: ${impagos.reduce((s,f)=>s+f.total,0)}€ pendientes.`,
    accion: "Enviar recordatorios",
  });
  const anomalo = input.gastos.find(g=>g.importe>800 && g.recurrencia==="puntual");
  if (anomalo) out.push({ tipo:"aviso", titulo:`Gasto puntual elevado: ${anomalo.proveedor}`,
    detalle:`${anomalo.importe}€ — ¿factura correcta?`, accion:"Ver gasto" });
  const elec = input.suministros.filter(s=>s.tipo==="electricidad").slice(-3);
  if (elec.length===3 && elec[2].importe < elec[0].importe*0.85) out.push({
    tipo:"info", titulo:"Tu luz baja mes a mes",
    detalle:`De ${elec[0].importe}€ a ${elec[2].importe}€ en 3 meses.`, accion:"Ver previsión",
  });
  return out;
}

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
