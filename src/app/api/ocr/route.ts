import { NextResponse } from "next/server";

const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

function extraerFecha(lines: string[]): string {
  const hoy = new Date().toISOString().split("T")[0];
  for (const line of lines) {
    const m = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (m) {
      let d = parseInt(m[1]), mes = parseInt(m[2]), a = parseInt(m[3]);
      if (a > 2400) a -= 543;
      if (a < 100) a += 2000;
      if (d >= 1 && d <= 31 && mes >= 1 && mes <= 12 && a >= 2000 && a <= 2100) {
        return `${a}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    const m2 = line.match(/(\d{1,2})\s*de\s*([a-záéíóúñ]+)\s*de\s*(\d{4})/i);
    if (m2) {
      const meses: Record<string, number> = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12 };
      const mesNum = meses[m2[2].toLowerCase()];
      if (mesNum) return `${m2[3]}-${String(mesNum).padStart(2, "0")}-${String(parseInt(m2[1])).padStart(2, "0")}`;
    }
  }
  return hoy;
}

function extraerProveedor(lines: string[]): string {
  const skipWords = ["nif", "cif", "domicilio", "factura", "ticket", "recibo", "fecha", "teléfono", "telefono", "total", "importe", "iva", "base", "pagina", "página"];
  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/^[#*\d\s\.]+/, "").trim();
    if (clean.length < 4 || skipWords.some(w => clean.toLowerCase().startsWith(w))) continue;
    if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúña-z\s,\.&'\-º]+$/.test(clean) || /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,\.&'\-º]+$/.test(clean)) return clean;
  }
  for (const line of lines.slice(0, 3)) {
    const clean = line.replace(/^[#*\d\s\.]+/, "").trim();
    if (clean.length >= 4 && !skipWords.some(w => clean.toLowerCase().startsWith(w))) return clean;
  }
  return lines[0] || "Proveedor desconocido";
}

function extraerImporte(lines: string[]): number {
  const totalKw = ["total", "suma", "importe", "a pagar", "total factura", "neto", "euros", "cobrado", "efectivo", "tarjeta"];
  const amounts: { val: number; idx: number; nearTotal: boolean }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lc = lines[i].toLowerCase();
    const m = lines[i].match(/(\d+[.,]\d{2})\s*€?/);
    if (m) {
      const val = parseFloat(m[1].replace(",", "."));
      const nearTotal = totalKw.some(kw => lc.includes(kw));
      amounts.push({ val, idx: i, nearTotal });
    }
  }
  if (amounts.length === 0) return 0;
  const nearTotal = amounts.filter(a => a.nearTotal);
  if (nearTotal.length > 0) return nearTotal[nearTotal.length - 1].val;
  return amounts[amounts.length - 1].val;
}

function extraerIVA(lines: string[]): number {
  for (const line of lines) { const m = line.match(/IVA\s*[:\s]*(\d+)/i); if (m) return parseInt(m[1]); }
  return 21;
}

function clasificarCategoria(texto: string, proveedor: string): string {
  const t = (texto + " " + proveedor).toLowerCase();
  if (/\b(uniforme|babero|delantal|chándal|chandal|bata|mandil|peto)\b/i.test(t)) return "material";
  if (/\b(comedor|cocina|menú|menu|catering|alimento|alimentación|alimentacion|restaurante|bar|cafetería|cafeteria|supermercado|fruta|verdura|carne|pescado|pan|panadería|panaderia|lácteo|lacteo|leche|huevo|bebida|kebab|pizza|hamburguesa|makro|arroz|pasta|aceite|puré|pure|potito|merienda|desayuno|almuerzo)\b/i.test(t)) return "alimentacion";
  if (/\b(insumo|insumos|menaje|batería|bateria|olla|sartén|sarten|cazo|fuente|bandeja|vaso|plato|taza|cubierto|tenedor|cuchara|servilleta|mantel)\b/i.test(t)) return "alimentacion";
  if (/\b(juguete|papelería|papeleria|librería|libreria|oficina|cuaderno|bolígrafo|boligrafo|rotulador|pintura|témpera|tempera|plastilina|arcilla|pegamento|tijera|goma|folio|carpeta|cartulina|gomets|ceras|lápiz|lapiz|sacapuntas|grapadora|clip|sobre|etiqueta|sello|bloc|dibujo|acuarela|manualidad|puzzle|construcción|construccion|bloques|abaco|didáctico|didactico|pedagógico|pedagogico|montessori|waldorf|estimulación|estimulacion|psicomotricidad|sensorial|escolar|aula|enseñanza|formación|formacion|taller|pañal|panal|toallita|protector\s+solar)\b/i.test(t)) return "material";
  if (/\b(lejía|lejia|detergente|jabón|jabon|lavavajillas|estropajo|bayeta|fregasuelos|ambientador|suavizante|cloro|alcohol|desinfectante|guante|bolsa\s+basura|recogedor|escoba|fregona|cubo|quitamanchas|higienizante|antiséptico|antiseptico)\b/i.test(t)) return "limpieza";
  if (/\b(luz|electricidad|gas|agua|internet|teléfono|telefono|movil|móvil|fibra|tarifa|suministro|endesa|iberdrola|naturgy|repsol|vodafone|movistar|orange|yoigo|masmovil)\b/i.test(t)) return "suministros";
  if (/\b(mantenimiento|reparación|reparacion|fontanería|fontaneria|electricista|pintor|albañil|carpintero|cerrajero|jardinería|jardineria|técnico|tecnico|avería|averia|arreglo|obra|reforma|construcción|construccion)\b/i.test(t)) return "mantenimiento";
  if (/\b(seguro|póliza|poliza|axa|mapfre|segurcaixa|allianz|reale|generali|mutua|cobertura|aseguradora)\b/i.test(t)) return "seguros";
  if (/\b(combustible|gasolina|gasóleo|gasoleo|diésel|diesel|carburante|gasolinera|aparcamiento|parking|peaje|estacionamiento|tren|metro|autobús|autobus|bus|taxi|uber|transporte|billete|vuelo|avión|avion|aeropuerto|aerolinea|aena|terminal|equipaje|boarding|embarque|vuelo|vuelos|reserva\s+vuelo|ticket\s+avión|billete\s+avión|billete\s+avion|tarjeta\s+embarque)\b/i.test(t)) return "transporte";
  if (/\b(farmacia|medicamento|medicina|médico|medico|pediatra|enfermero|enfermera|hospital|clínica|clinica|ambulatorio|vacuna|analítica|analitica|receta|fisioterapia|dentista|oftalmólogo|oftalmologo|optometrista|salud)\b/i.test(t)) return "salud";
  if (/\b(ocio|extraescolar|excursión|excursion|colonia|campamento|cine|teatro|concierto|museo|parque|hotel|alojamiento|airbnb|booking|viaje|turismo|entretenimiento|espectáculo|espectaculo)\b/i.test(t)) return "ocio";
  if (/\b(gestoría|gestoria|asesor|asesoría|asesoria|contable|contabilidad|notaría|notaria|abogado|registro|impuesto|tributo|fiscal|tasa)\b/i.test(t)) return "gestoria";
  if (/\b(publicidad|marketing|anuncio|google|facebook|instagram|folleto|volante|cartel|seo|branding|logo|diseño|diseno|web|dominio|hosting|newsletter)\b/i.test(t)) return "marketing";
  if (/\b(alquiler|arrendamiento|hipoteca|propietario)\b/i.test(t)) return "alquiler";
  if (/\b(nómina|personal|empleado|salario|seguridad\s+social)\b/i.test(t)) return "personal";
  if (/\b(formación|formacion|curso|congreso|jornada|seminario|workshop|homologación|homologacion|certificación|certificacion|capacitación|capacitacion)\b/i.test(t)) return "formacion";
  return "otros";
}

async function analizarConGroq(ocrText: string): Promise<Record<string, any> | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto analizando facturas y tickets. Extrae los datos en JSON. " +
              "Devuelve SOLO JSON válido, sin texto adicional, sin markdown.",
          },
          {
            role: "user",
            content:
              `Texto extraído de una factura/ticket mediante OCR:\n\n${ocrText}\n\n` +
              `Analiza el texto y devuelve un JSON con estos campos EXACTOS:\n` +
              `- proveedor: string (nombre del establecimiento o empresa)\n` +
              `- fecha: string (fecha del documento en formato YYYY-MM-DD, busca la fecha en el texto, no la de hoy)\n` +
              `- importe: number (importe total en EUR, si está en otra moneda conviértelo a EUR usando tasa de cambio actual)\n` +
              `- moneda_original: string | null (código de moneda si no es EUR, ej: "THB", "USD", "GBP". null si es EUR)\n` +
              `- importe_original: number | null (importe en moneda original, null si es EUR)\n` +
              `- tasa_cambio: number | null (tasa usada para convertir a EUR, null si es EUR)\n` +
              `- iva: number (porcentaje de IVA, 21 si no se encuentra)\n` +
              `- categoria: string (elige UNA: alimentacion, material, mantenimiento, suministros, personal, seguros, limpieza, alquiler, gestoria, marketing, formacion, transporte, salud, ocio, compras, otros)\n\n` +
              `Presta atención a:\n` +
              `- Fechas: busca la fecha real del ticket/factura en el texto, no inventes\n` +
              `- Importe: el TOTAL final, no una línea intermedia. Busca palabras como TOTAL, SUMA, IMPORTE, A PAGAR\n` +
              `- Moneda: detecta símbolos (฿ $ £ ¥) o códigos (THB USD GBP JPY). Si no ves símbolo de euro, asume moneda local y conviértela\n` +
              `- Categoría: usa el contexto. Un vuelo es "transporte". Un restaurante es "alimentacion". Una farmacia es "salud"\n` +
              `- IVA: busca el porcentaje explícito. Si no aparece, usa 21`,
          },
        ],
        temperature: 0.1,
        max_tokens: 600,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.proveedor && parsed.importe) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      if (ext === "pdf") {
        return NextResponse.json({ error: "Los PDF no se procesan directamente. Convierte la primera página a JPG o PNG e inténtalo de nuevo." }, { status: 400 });
      }
      return NextResponse.json({ error: `Formato "${ext}" no soportado. Usa JPG, PNG o WebP.` }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande. Máximo 10MB." }, { status: 400 });
    }

    if (!VISION_API_KEY) {
      return NextResponse.json({ error: "Google Vision API no configurada. Añade GOOGLE_VISION_API_KEY en las variables de entorno de Netlify." }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
          }],
        }),
      },
    );

    if (!visionRes.ok) {
      const err = await visionRes.text();
      const msg = visionRes.status === 403 ? "Google Vision API requiere billing. Actívalo en https://console.developers.google.com" : `Error de Vision API: ${err.slice(0, 300)}`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const visionData = await visionRes.json();
    const detectedText: string = visionData?.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!detectedText) {
      return NextResponse.json({ error: "No se detectó texto en la imagen. Asegúrate de que la factura sea legible." }, { status: 400 });
    }

    const lines = detectedText.split("\n").map(l => l.trim()).filter(Boolean);

    let proveedor = extraerProveedor(lines);
    let fecha = extraerFecha(lines);
    let importe = extraerImporte(lines);
    let iva = extraerIVA(lines);
    let categoria = clasificarCategoria(detectedText, proveedor);
    let concepto = `OCR: ${proveedor}`;
    let notas = detectedText.slice(0, 500);
    let modo = "regex";

    const ai = await analizarConGroq(detectedText);
    if (ai) {
      modo = "groq";
      if (ai.proveedor && typeof ai.proveedor === "string" && ai.proveedor.length > 2) proveedor = ai.proveedor;
      if (ai.fecha && typeof ai.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ai.fecha)) fecha = ai.fecha;
      if (ai.importe && typeof ai.importe === "number" && ai.importe > 0) importe = ai.importe;
      if (ai.iva && typeof ai.iva === "number" && ai.iva > 0) iva = ai.iva;
      if (ai.categoria && typeof ai.categoria === "string") categoria = ai.categoria;
      if (ai.moneda_original && ai.importe_original) {
        concepto = `OCR: ${proveedor} (${ai.moneda_original} ${ai.importe_original} → ${importe}€)`;
        notas = `Moneda original: ${ai.moneda_original} ${ai.importe_original} (tasa: ${ai.tasa_cambio || "N/A"})\n` + notas;
      } else {
        concepto = `OCR: ${proveedor}`;
      }
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      modo,
      ocr: { proveedor, concepto, importe, iva, categoria, fecha, notas: notas.slice(0, 600) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Error interno: ${err?.message?.slice(0, 300)}` }, { status: 500 });
  }
}
