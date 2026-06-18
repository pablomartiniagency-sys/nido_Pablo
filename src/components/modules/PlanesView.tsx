"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { createIdentityClient } from "@/lib/supabase-identity";
import { useToast } from "@/components/ui/Toast";

const PLANS = [
  {
    id: "pro",
    name: "Básico",
    price: 129,
    desc: "Para escuelas que empiezan su digitalización",
    features: [
      "Gestión de familias y alumnos",
      "Facturación con SEPA",
      "Contabilidad básica",
      "Gestión de comedor y menú semanal",
      "Asistente IA",
      "CRM de leads y oportunidades",
      "Empleados y nóminas",
      "Almacenamiento en la nube",
      "Soporte por email",
    ],
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 179,
    desc: "La solución completa para escuelas en crecimiento",
    features: [
      "Todo lo del plan Básico",
      "Contabilidad completa (asientos, balances)",
      "Bot de WhatsApp automatizado",
      "Integración con Gmail",
      "Recordatorios automáticos de pago",
      "Informes exportables para gestoría",
      "Múltiples usuarios secundarios",
      "Soporte prioritario 24h",
    ],
    highlight: true,
  },
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: "Activa", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  past_due: { label: "Pago pendiente", color: "bg-amber-100 text-amber-700 border-amber-200" },
  canceled: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-200" },
  incomplete: { label: "Incompleta", color: "bg-gray-100 text-gray-700 border-gray-200" },
  inactive: { label: "Inactiva", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function PlanesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // On mount: detect successful checkout return, or load subscription from user metadata
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (sessionId) {
        toast("Suscripción realizada con éxito", "success");
        const identity = createIdentityClient();
        if (identity) await identity.auth.refreshSession();
        window.history.replaceState({}, "", "/planes");
      }
      const identity = createIdentityClient();
      if (identity) {
        const { data: { user: fresh } } = await identity.auth.getUser();
        if (fresh?.app_metadata?.stripe_subscription) {
          setSubscription(fresh.app_metadata.stripe_subscription);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const identity = createIdentityClient();
      if (!identity) throw new Error("Identity no disponible");
      const { data: { session } } = await identity.auth.getSession();
      if (!session) throw new Error("No hay sesión");
      if (!user?.email) throw new Error("Email no disponible");

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          planId,
          returnUrl: window.location.origin + "/planes",
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast(data.error || "Error al crear sesión de pago", "error");
    } catch (err: any) {
      toast(err?.message || "Error desconocido", "error");
    } finally {
      setSubscribing(null);
    }
  };

  const handleManageSubscription = async () => {
    const customerId = subscription?.customerId;
    if (!customerId) { toast("No hay suscripción activa", "error"); return; }
    try {
      const identity = createIdentityClient();
      if (!identity) return;
      const { data: { session } } = await identity.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ customerId, returnUrl: window.location.origin + "/planes" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast("Error al abrir el portal de pago", "error");
    } catch {
      toast("Error de conexión", "error");
    }
  };

  const currentPlan = subscription?.plan || null;
  const status = subscription?.status || null;
  const statusBadge = status ? STATUS_BADGES[status] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-lapis-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Planes y precios</h1>
        <p className="text-sm text-ink-400 mt-1">
          {currentPlan
            ? `Plan actual: ${currentPlan === "premium" ? "Premium" : "Básico"}`
            : "Elige el plan que mejor se adapte a tu escuela"}
        </p>
      </div>

      {currentPlan && (
        <div className="flex items-center justify-center gap-3">
          {statusBadge && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          )}
          <button onClick={handleManageSubscription}
            className="text-xs text-lapis-500 hover:text-lapis-700 underline underline-offset-2">
            Gestionar suscripción en Stripe
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;

          return (
            <div key={plan.id}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                plan.highlight
                  ? "border-lapis-400 bg-gradient-to-b from-lapis-50/50 to-white shadow-lg shadow-lapis-200/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lapis-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recomendado
                </div>
              )}

              {isActive && (
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Plan actual
                  </span>
                </div>
              )}

              <div className="text-center pt-2">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold">{plan.price}€</span>
                  <span className="text-sm text-ink-400">/mes</span>
                </div>
                <p className="text-xs text-ink-400 mt-1">{plan.desc}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span className="text-ink-600">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isActive ? (
                  <button onClick={handleManageSubscription}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-lapis-400 text-lapis-600 hover:bg-lapis-50 transition">
                    Gestionar suscripción
                  </button>
                ) : currentPlan ? (
                  <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-lapis-500 text-white hover:bg-lapis-600 disabled:opacity-50 transition">
                    {subscribing === plan.id ? "Redirigiendo..." : "Cambiar a " + plan.name}
                  </button>
                ) : (
                  <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                      plan.highlight
                        ? "bg-lapis-500 text-white hover:bg-lapis-600"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}>
                    {subscribing === plan.id ? "Redirigiendo..." : "Suscribirse"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-xs text-ink-400">
          Cancelación gratuita en cualquier momento. Sin permanencia.
          <br />
          Pago seguro a través de Stripe.
        </p>
      </div>
    </div>
  );
}
