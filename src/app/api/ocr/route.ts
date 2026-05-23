import { NextResponse } from "next/server";

const VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;

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
    const proveedor = lines.find(l => /^[A-ZÑÁÉÍÓÚ][A-Za-zÑñáéíóú\s,\.&]+$/.test(l) && l.length > 5) || lines[0] || "Proveedor desconocido";

    let importe = 0;
    for (const line of lines) {
      const match = line.match(/(\d+[.,]\d{2})\s*€?/);
      if (match) { importe = parseFloat(match[1].replace(",", ".")); break; }
    }

    let iva = 21;
    for (const line of lines) { const m = line.match(/IVA\s*[:\s]*(\d+)/i); if (m) { iva = parseInt(m[1]); break; } }

    const t = detectedText.toLowerCase();
    let categoria = "otros";
    if (/\b(alimentación|comida|restaurante|supermercado|fruta|verdura|carne|pescado|pan|lácteo)\b/.test(t)) categoria = "alimentacion";
    else if (/\b(material|didáctico|juguete|papelería|educativo|librería)\b/.test(t)) categoria = "material";
    else if (/\b(limpieza|higiene|detergente|lejía|papel)\b/.test(t)) categoria = "limpieza";
    else if (/\b(luz|electricidad|gas|agua|internet|teléfono|movil)\b/.test(t)) categoria = "suministros";
    else if (/\b(mantenimiento|reparación|fontanería|electricista|pintura)\b/.test(t)) categoria = "mantenimiento";
    else if (/\b(seguro|póliza|axa|mapfre)\b/.test(t)) categoria = "seguros";

    return NextResponse.json({
      success: true,
      filename: file.name,
      ocr: { proveedor, concepto: `OCR: ${proveedor} — ${new Date().toLocaleDateString("es-ES")}`, importe, iva, categoria, notas: detectedText.slice(0, 500) },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `Error interno: ${err?.message?.slice(0, 300)}` }, { status: 500 });
  }
}
