import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY no está configurada");
    _stripe = new Stripe(key, {});
  }
  return _stripe;
}

export const PLANS = {
  pro: { id: "pro", name: "Básico", price: 129, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "" },
  premium: { id: "premium", name: "Premium", price: 179, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || "" },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string) {
  return Object.values(PLANS).find(p => p.priceId === priceId) || null;
}
