import { NextResponse } from "next/server";
import { getStripe, getPlanByPriceId } from "@/lib/stripe";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = getIdentityAdminClient();
  if (!admin) {
    console.error("[Stripe Webhook] Identity admin client no configurado");
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 });
  }

  const db = admin!;
  async function updateTenant(tenantId: string, data: Record<string, unknown>) {
    await (db.from("identity_tenants") as any).update(data).eq("id", tenantId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const tenantId = session.metadata?.tenantId;
        const planId = session.metadata?.planId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (tenantId && customerId) {
          await updateTenant(tenantId, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            plan: planId || null,
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subTenantId = subscription.metadata?.tenantId;
        const status = subscription.status === "active" || subscription.status === "trialing" ? "active"
          : subscription.status === "past_due" ? "past_due"
          : subscription.status === "canceled" ? "canceled"
          : subscription.status === "incomplete" ? "incomplete"
          : "inactive";

        const items = subscription.items?.data;
        const priceId = items?.[0]?.price?.id;
        const plan = priceId ? getPlanByPriceId(priceId) : null;

        if (subTenantId) {
          await updateTenant(subTenantId, {
            subscription_status: status,
            plan: plan?.id || null,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          });
        } else {
          const { data: tenants } = await (db.from("identity_tenants") as any).select("id").eq("stripe_subscription_id", subscription.id).limit(1);
          if (tenants?.[0]) {
            await updateTenant(tenants[0].id, {
              subscription_status: status,
              plan: plan?.id || null,
              updated_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const { data: tenants } = await (db.from("identity_tenants") as any).select("id").eq("stripe_subscription_id", subscriptionId).limit(1);
          if (tenants?.[0]) {
            await updateTenant(tenants[0].id, {
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Error:", err);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
