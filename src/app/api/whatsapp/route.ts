import { NextResponse } from "next/server";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "nido-webhook-2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return NextResponse.json({ status: "ok" });

    const from = message.from;
    const text = message.text?.body || "";

    console.log(`[WhatsApp] Mensaje de ${from}: ${text}`);

    if (WHATSAPP_TOKEN) {
      await fetch(
        `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: `Hola! Hemos recibido tu mensaje: "${text.slice(0, 100)}". Te responderemos en horario de atención al cliente.` },
          }),
        },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("[WhatsApp] Error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
