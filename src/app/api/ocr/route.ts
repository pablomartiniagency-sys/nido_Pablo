import { NextResponse } from "next/server";

const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

function extraerFecha(lines: string[]): string {
  const hoy = new Date().toISOString().split("T")[0];
  for (const line of lines) {
    const m = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (m) {
      let d = parseInt(m[1]), mes = parseInt(m[2]), a = parseInt(m[3]);
      if (a < 100) a += 2000;
      if (d >= 1 && d <= 31 && mes >= 1 && mes <= 12) {
        const iso = `${a}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (iso <= hoy) return iso;
      }
    }
    const m2 = line.match(/(\d{1,2})\s*de\s*([a-záéíóúñ]+)\s*de\s*(\d{4})/i);
    if (m2) {
      const meses: Record<string, number> = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12 };
      const mesNum = meses[m2[2].toLowerCase()];
      if (mesNum) {
        const iso = `${m2[3]}-${String(mesNum).padStart(2, "0")}-${String(parseInt(m2[1])).padStart(2, "0")}`;
        if (iso <= hoy) return iso;
      }
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
  const totalKw = ["total", "suma", "importe", "a pagar", "total factura", "neto", "euros", "cobrado", "cargo", "abonado", "efectivo", "tarjeta"];
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
  for (const line of lines) {
    const m = line.match(/IVA\s*[:\s]*(\d+)/i);
    if (m) return parseInt(m[1]);
  }
  return 21;
}

function clasificarCategoria(texto: string, proveedor: string): string {
  const t = (texto + " " + proveedor).toLowerCase();

  if (/\b(uniforme|babero|delantal|chándal|chandal|bata|mandil|peto)\b/i.test(t)) return "material";

  if (/\b(insumo|insumos|menaje|batería|bateria|olla|sartén|sarten|cazo|fuente|bandeja|tupper|táper|taper|vaso|plato|taza|cubierto|tenedor|cuchara|servilleta|mantel|film|papel\s+film|papel\s+aluminio)\b/i.test(t)) return "alimentacion";

  if (/\b(comedor|cocina|menú|menu|catering|alimento|alimentación|alimentacion|restaurante|bar|cafetería|cafeteria|supermercado|fruta|verdura|carne|pescado|pan|panadería|panaderia|lácteo|lacteo|leche|huevo|comestible|mercado|carnicería|carniceria|pescadería|pescaderia|frutería|fruteria|bebida|cerveza|vino|refresco|kebab|pizza|hamburguesa|mcdonald|burger|deliveroo|glovo|makro|alipende|gallo|arroz|pasta|aceite|legumbre|conserva|batido|yogur|galleta|cereal|mermelada|nutella|colacao|nesquik|puré|pure|potito|merienda|desayuno|almuerzo)\b/i.test(t)) return "alimentacion";

  if (/\b(juguete|papelería|papeleria|librería|libreria|oficina|cuaderno|bolígrafo|boligrafo|rotulador|pintura|témpera|tempera|plastilina|arcilla|pegamento|tijera|goma|folio|carpeta|cartulina|gomets|ceras|lápiz|lapiz|sacapuntas|grapadora|perforadora|clip|fundas|sobre|etiqueta|sello|tampón|tapon|compás|compas|regla|escuadra|cartabón|cartabon|bloc|dibujo|acuarela|manualidad|puzzle|construcción|construccion|bloques|abaco|didáctico|didactico|pedagógico|pedagogico|montessori|waldorf|estimulación|estimulacion|psicomotricidad|sensorial|escolar|aula|enseñanza|formación|formacion|taller)\b/i.test(t)) return "material";

  if (/\b(pañal|panal|toallita|toallita\s+húmeda|crema\s+cambio|pomada|vaselina|talco|protector\s+solar|crema\s+solar)\b/i.test(t)) return "material";

  if (/\b(lejía|lejia|detergente|jabón|jabon|lavavajillas|estropajo|bayeta|fregasuelos|ambientador|suavizante|cloro|alcohol|desinfectante|guante|bolsa\s+basura|recogedor|escoba|fregona|cubo|limpia|cristales|limpia|cristal|quitamanchas|multiusos|cepillos|higienizante|antiséptico|antiseptico)\b/i.test(t)) return "limpieza";

  if (/\b(papel\s+higienico|papel\s+higienico|papel\s+wc|rollo\s+cocina)\b/i.test(t)) return "limpieza";

  if (/\b(luz|electricidad|gas|agua|internet|teléfono|telefono|movil|móvil|fibra|tarifa|suministro|endesa|iberdrola|naturgy|repsol|vodafone|movistar|orange|yoigo|masmovil)\b/i.test(t)) return "suministros";

  if (/\b(mantenimiento|reparación|reparacion|fontanería|fontaneria|electricista|pintor|albañil|carpintero|cerrajero|jardinería|jardineria|técnico|tecnico|avería|averia|arreglo|obra|reforma|construcción|construccion)\b/i.test(t)) return "mantenimiento";

  if (/\b(seguro|póliza|poliza|axa|mapfre|segurcaixa|allianz|reale|generali|mutua|cobertura|aseguradora)\b/i.test(t)) return "seguros";

  if (/\b(combustible|gasolina|gasóleo|gasoleo|diésel|diesel|carburante|gasolinera|aparcamiento|parking|peaje|estacionamiento|tren|metro|autobús|autobus|bus|taxi|uber|transporte|billete|vuelo|avión|avion)\b/i.test(t)) return "transporte";

  if (/\b(farmacia|medicamento|medicina|médico|medico|pediatra|enfermero|enfermera|hospital|clínica|clinica|ambulatorio|vacuna|analítica|analitica|receta|fisioterapia|dentista|oftalmólogo|oftalmologo|optometrista|salud)\b/i.test(t)) return "salud";

  if (/\b(ocio|extraescolar|excursión|excursion|colonia|campamento|cine|teatro|concierto|museo|parque|hotel|alojamiento|airbnb|booking|viaje|turismo|entretenimiento|espectáculo|espectaculo)\b/i.test(t)) return "ocio";

  if (/\b(gestoría|gestoria|asesor|asesoría|asesoria|contable|contabilidad|notaría|notaria|abogado|registro|impuesto|tributo|fiscal|tasa)\b/i.test(t)) return "gestoria";

  if (/\b(publicidad|marketing|anuncio|google|facebook|instagram|redes\s+sociales|folleto|volante|cartel|flyer|seo|branding|logo|diseño|diseno|web|dominio|hosting|newsletter)\b/i.test(t)) return "marketing";

  if (/\b(alquiler|arrendamiento|hipoteca|propietario)\b/i.test(t)) return "alquiler";

  if (/\b(nómina|personal|empleado|salario|seguridad\s+social)\b/i.test(t)) return "personal";

  if (/\b(formación|formacion|curso|congreso|jornada|seminario|workshop|homologación|homologacion|certificación|certificacion|capacitación|capacitacion)\b/i.test(t)) return "formacion";

  return "otros";
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

    const res = await fetch(
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

    if (!res.ok) {
      const err = await res.text();
      const msg = res.status === 403 ? "Google Vision API requiere billing. Actívalo en https://console.developers.google.com" : `Error de Vision API: ${err.slice(0, 300)}`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    const detectedText: string = data?.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!detectedText) {
      return NextResponse.json({ error: "No se detectó texto en la imagen. Asegúrate de que la factura sea legible." }, { status: 400 });
    }

    const lines = detectedText.split("\n").map(l => l.trim()).filter(Boolean);
    const fecha = extraerFecha(lines);
    const proveedor = extraerProveedor(lines);
    const importe = extraerImporte(lines);
    const iva = extraerIVA(lines);
    const categoria = clasificarCategoria(detectedText, proveedor);

    return NextResponse.json({
      success: true,
      filename: file.name,
      ocr: { proveedor, concepto: `OCR: ${proveedor}`, importe, iva, categoria, fecha, notas: detectedText.slice(0, 500) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Error interno: ${err?.message?.slice(0, 300)}` }, { status: 500 });
  }
}
