import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { customerId, returnUrl } = await req.json();

    if (!customerId || !returnUrl) {
      return NextResponse.json({ error: "customerId y returnUrl requeridos" }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe Portal] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
