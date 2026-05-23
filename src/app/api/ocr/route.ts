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
  const totalKeywords = ["total", "suma", "importe", "a pagar", "total factura", "neto", "euros", "cobrado", "cargo", "abonado", "efectivo", "tarjeta"];
  const amounts: { val: number; idx: number; nearTotal: boolean }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const m = lines[i].match(/(\d+[.,]\d{2})\s*€?/);
    if (m) {
      const val = parseFloat(m[1].replace(",", "."));
      const nearTotal = totalKeywords.some(kw => line.includes(kw));
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
  for (const line of lines) {
    const clean = line.replace(/\s/g, "").toLowerCase();
    if (clean.includes("iva")) {
      const m = line.match(/(\d+[.,]\d{2})/);
      if (m) return 21;
    }
  }
  return 21;
}

function clasificarCategoria(texto: string, proveedor: string): string {
  const t = (texto + " " + proveedor).toLowerCase();
  if (/\b(alimentación|alimentacion|comida|restaurante|bar|cafetería|cafeteria|supermercado|fruta|verdura|carne|pescado|pan|panadería|panaderia|lácteo|leche|huevo|comestible|mercado|carnicería|carniceria|pescadería|pescaderia|frutería|fruteria|comer|bebida|cerveza|vino|refresco|comida rápida|comida rapida|kebab|pizza|hamburguesa|mcdonald|burger|deliveroo|uber eats|glovo|just eat)\b/.test(t)) return "alimentacion";
  if (/\b(material|didáctico|didactico|juguete|papelería|papeleria|educativo|librería|libreria|oficina|útil|util|escolar|clase|aula|enseñanza|formación|formacion|curso|taller|libro|cuaderno|bolígrafo|boligrafo|rotulador|pintura|témpera|tempera|plastilina|arcilla|pegamento|tijera|goma|folio|carpeta)\b/.test(t)) return "material";
  if (/\b(limpieza|higiene|detergente|lejía|lejia|papel higiénico|papel higienico|toallita|jabón|jabon|lavavajillas|estropajo|bayeta|fregasuelos|ambientador|suavizante|cloro|alcohol|desinfectante|guante|bolsa basura|recogedor|escoba|fregona|cubo)\b/.test(t)) return "limpieza";
  if (/\b(luz|electricidad|gas|agua|internet|teléfono|telefono|movil|móvil|fibra|tarifa|recibo luz|recibo gas|recibo agua|factura luz|factura gas|factura agua|suministro|endesa|iberdrola|naturgy|repsol|vodafone|movistar|orange|yoigo|masmovil)\b/.test(t)) return "suministros";
  if (/\b(mantenimiento|reparación|reparacion|fontanería|fontaneria|electricista|pintura|pintor|albañil|albañileria|albañilería|carpintero|carpintería|carpinteria|cerrajero|cerrajería|cerrajeria|jardinería|jardineria|limpieza|técnico|tecnico|avería|averia|arreglo|obra|reforma)\b/.test(t)) return "mantenimiento";
  if (/\b(seguro|póliza|poliza|axa|mapfre|segurcaixa|allianz|reale|generali|mutua|previsión|prevision|cobertura|aseguradora)\b/.test(t)) return "seguros";
  if (/\b(combustible|gasolina|gasóleo|gasoleo|diésel|diesel|carburante|repsol|cepsa|bp|shell|gasolinera|aparcamiento|parking|peaje|estacionamiento|aparcar|parking|tren|metro|autobús|autobus|bus|taxi|uber|glovo|deliveroo|transporte|viaje|billete|vuelo|avión|avion|aena)\b/.test(t)) return "transporte";
  if (/\b(farmacia|farmacéutico|farmaceutico|medicamento|medicina|médico|medico|hospital|clínica|clinica|ambulatorio|salud|dentista|oftalmólogo|oftalmologo|analítica|analitica|receta|fisioterapia|seguro médico|seguro medico)\b/.test(t)) return "salud";
  if (/\b(hostelería|hosteleria|hotel|alojamiento|alquiler|airbnb|booking|viaje|turismo|vacación|vacacion|ocio|entretenimiento|cine|teatro|concierto|espectáculo|espectaculo|museo|parque|atracción|atraccion|turístico|turistico)\b/.test(t)) return "ocio";
  if (/\b(ropa|calzado|vestido|zapato|camiseta|pantalón|pantalon|chaqueta|abrigo|moda|tienda|almacén|almacen|centro comercial|compra|shopping|bazar|todo a cien|chino|outlet)\b/.test(t)) return "compras";
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
