import { NextResponse } from "next/server";

const GROQ_KEY = process.env.GROQ_API_KEY;

interface MenuDay {
  dia: string;
  primero: string;
  segundo: string;
  postre: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const menu: MenuDay[] = body.menu;
    if (!menu || !menu.length) {
      return NextResponse.json({ alergenos: [] });
    }

    if (!GROQ_KEY) {
      return NextResponse.json({ alergenos: detectarLocal(menu) });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 600,
        messages: [
          { role: "system", content: `Eres un experto en seguridad alimentaria en escuelas infantiles.
Analiza el menú semanal y detecta qué platos contienen alérgenos comunes.
Responde ÚNICAMENTE con un JSON array con objetos:
{ "dia": string, "plato": "primero"|"segundo"|"postre", "nombre": string, "alergenos": string[] }

Alérgenos a detectar: leche/huevo/gluten/frutos secos/pescado/marisco/soja/sésamo/sulfitos/altramuz/moluscos
Si un plato no tiene alérgenos claros, devuelve array vacío.
Ejemplo: {"dia":"lunes","plato":"segundo","nombre":"Merluza al horno","alergenos":["pescado"]}
Devuelve SOLO el JSON array, sin markdown ni texto adicional.` },
          { role: "user", content: JSON.stringify(menu) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    const alergenos = JSON.parse(content);
    return NextResponse.json({ alergenos });
  } catch (err: any) {
    console.warn("[DetectarAlergenos] Error:", err?.message?.slice(0, 200));
    const body = await req.json().catch(() => ({ menu: [] }));
    return NextResponse.json({ alergenos: detectarLocal(body.menu) });
  }
}

const ALERGENOS_PATRONES: [RegExp, string[]][] = [
  [/\bleche\b|\blácteo\b|\bnata\b|\bqueso\b|\byogur\b|\bmantequilla\b|\bcrema de leche\b|\bbechamel\b|\bflan\b|\bnatillas\b/i, ["leche"]],
  [/\bhuevo\b|\btortilla\b|\brevuelto\b|\bmayonesa\b|\bbizcocho\b|\bmagdalen[ao]\b/i, ["huevo"]],
  [/\bpan\b|\bharina\b|\btrigo\b|\bpasta\b|\bgallet[ao]\b|\bcrepe\b|\btortita\b|\btortilla de (trigo|maíz)\b|\bbizcocho\b|\bempanadill[ao]\b|\bmasa\b|\bsémola\b|\bcuscús\b|\bcus cus\b|\bseitan\b|\bpan rallado\b|\brebozado\b|\brebozar\b/i, ["gluten"]],
  [/\bfruto seco\b|\bnuez\b|\balmendra\b|\bavellana\b|\bcacahuet[ea]\b|\bpistach[oa]\b|\banacardo\b|\bcrema de cacahuete\b|\bnutella\b|\bturrón\b|\bmazapán\b|\bmarcona\b|\bpiñón\b|\bpiñones\b/i, ["frutos secos"]],
  [/\bpescado\b|\bmerluza\b|\bsalmo[mn]\b|\batún\b|\btuna\b|\bbacalao\b|\blenguado\b|\bgall[oi]\b|\braya\b|\bpez espada\b|\bboquerón\b|\banchoa\b|\bsardina\b|\bmelva\b|\bempanadill[ao] de atún\b|\bsurimi\b|\bbrandada\b/i, ["pescado"]],
  [/\bgamba\b|\blangostino\b|\bmejillón\b|\bmejillones\b|\balmeja\b|\bcalamar\b|\bpulpo\b|\bsepia\b|\bchipirón\b|\bcigala\b|\bnécora\b|\bbogavante\b|\bmarisco\b|\bpaella\b.*\bmarisco\b/i, ["marisco"]],
  [/\bsoja\b|\btofu\b|\btempeh\b|\bedamame\b|\bleche de soja\b|\bbebida de soja\b|\bsalsa de soja\b/i, ["soja"]],
  [/\bsésamo\b|\bsesamo\b|\bsemilla de sésamo\b|\bgomasio\b|\btahini\b|\bajonjolí\b|\bajonjoli\b/i, ["sésamo"]],
  [/\baltramuz\b|\bchocho\b|\btremoço\b/i, ["altramuz"]],
  [/\bcaracol\b|\bbígaro\b|\bcañaílla\b|\bchirla\b|\bberberecho\b|\bvieira\b|\bzamburiña\b|\bostra\b|\bmejillón\b|\bmejillones\b/i, ["moluscos"]],
  [/\bvino\b|\bvinagre\b|\bcerveza\b|\bsidra\b|\bcava\b|\bconserva\b|\bencurtido\b/i, ["sulfitos"]],
];

function detectarLocal(menu: MenuDay[]) {
  const resultados: { dia: string; plato: string; nombre: string; alergenos: string[] }[] = [];
  for (const d of menu) {
    for (const campo of ["primero", "segundo", "postre"] as const) {
      const texto = d[campo];
      if (!texto) continue;
      const encontrados = new Set<string>();
      for (const [re, alergenos] of ALERGENOS_PATRONES) {
        if (re.test(texto)) {
          for (const al of alergenos) encontrados.add(al);
        }
      }
      if (encontrados.size > 0) {
        resultados.push({ dia: d.dia, plato: campo, nombre: texto, alergenos: Array.from(encontrados) });
      }
    }
  }
  return resultados;
}
