import { NextResponse } from "next/server";
import { getStripe, getPlanByPriceId } from "@/lib/stripe";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";

async function storeSubscriptionInUserMetadata(admin: any, userId: string, data: Record<string, any>) {
  try {
    await admin.auth.admin.updateUserById(userId, { app_metadata: data });
  } catch (err) {
    console.error("[Stripe Webhook] Error updating user metadata:", err);
  }
}

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId) {
          await storeSubscriptionInUserMetadata(admin, userId, {
            stripe_subscription: {
              customerId,
              subscriptionId,
              plan: planId || "pro",
              status: "active",
            },
          });

          // Also try to update/create tenant record
          try {
            const { data: tu } = await (db.from("identity_tenant_users") as any).select("tenant_id").eq("user_id", userId).maybeSingle();
            if (tu?.tenant_id) {
              await (db.from("identity_tenants") as any).update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: "active",
                plan: planId || null,
                updated_at: new Date().toISOString(),
              }).eq("id", tu.tenant_id);
            }
          } catch { /* tenant update is optional */ }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const status = subscription.status === "active" || subscription.status === "trialing" ? "active"
          : subscription.status === "past_due" ? "past_due"
          : subscription.status === "canceled" ? "canceled"
          : subscription.status === "incomplete" ? "incomplete"
          : "inactive";

        const items = subscription.items?.data;
        const priceId = items?.[0]?.price?.id;
        const plan = priceId ? getPlanByPriceId(priceId) : null;

        const subUserId = subscription.metadata?.userId;
        if (subUserId) {
          await storeSubscriptionInUserMetadata(admin, subUserId, {
            stripe_subscription: {
              customerId: subscription.customer as string,
              subscriptionId: subscription.id,
              plan: plan?.id || "pro",
              status,
            },
          });
        }

        // Also update tenant record if exists
        try {
          const { data: tenants } = await (db.from("identity_tenants") as any).select("id").eq("stripe_subscription_id", subscription.id).limit(1);
          if (tenants?.[0]) {
            await (db.from("identity_tenants") as any).update({
              subscription_status: status,
              plan: plan?.id || null,
              updated_at: new Date().toISOString(),
            }).eq("id", tenants[0].id);
          }
        } catch { /* optional */ }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          // Find user by subscription and update status
          try {
            const { data: tenants } = await (db.from("identity_tenants") as any).select("id").eq("stripe_subscription_id", subscriptionId).limit(1);
            if (tenants?.[0]) {
              await (db.from("identity_tenants") as any).update({
                subscription_status: "past_due",
                updated_at: new Date().toISOString(),
              }).eq("id", tenants[0].id);
            }
          } catch { /* optional */ }
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
