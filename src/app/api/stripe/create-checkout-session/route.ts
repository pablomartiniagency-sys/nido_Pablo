import { NextResponse } from "next/server";
import { getStripe, PLANS, type PlanId } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planId, returnUrl } = await req.json();

    if (!userId || !planId || !returnUrl) {
      return NextResponse.json({ error: "userId, planId y returnUrl requeridos" }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];
    if (!plan || !plan.priceId) {
      return NextResponse.json({ error: "Plan no válido o no configurado" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { userId, planId },
      subscription_data: {
        metadata: { userId, planId },
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe Checkout] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
