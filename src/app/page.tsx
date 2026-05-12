"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/landing/ContactForm";
import { Card } from "@/components/ui/Card";
import { IconAccounting, IconInvoice, IconChat, IconBolt, IconBowl, IconUsers } from "@/components/ui/Icons";
import { useState } from "react";

const FEATURES = [
  { icon: <IconAccounting width={20} height={20} />, title: "Contabilidad", desc: "OCR de facturas, clasificación automática y libro de gastos." },
  { icon: <IconInvoice width={20} height={20} />, title: "Facturación SEPA", desc: "Generación de remesas ISO 20022 pain.008.001.02." },
  { icon: <IconChat width={20} height={20} />, title: "Asistente IA", desc: "Consulta tus datos en lenguaje natural." },
  { icon: <IconBolt width={20} height={20} />, title: "Previsiones", desc: "Proyección de tesorería 3M con regresión lineal." },
  { icon: <IconBowl width={20} height={20} />, title: "Comedor", desc: "Menú semanal y detección de alérgenos." },
  { icon: <IconUsers width={20} height={20} />, title: "Empleados", desc: "Plantilla, ratios, incidencias y nóminas." },
];

export default function LandingPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen bg-grid bg-glow">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Logo href="/" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition">Iniciar sesión</Link>
          <Button size="sm" onClick={() => setShowContact(true)}>Solicitar demo</Button>
        </div>
      </header>

      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <div className="eyebrow mb-4">Delega · Producto SaaS</div>
        <h1 className="h-display mb-6">
          La secretaría digital<br />
          <span className="bg-gradient-to-r from-coral-300 to-coral-500 bg-clip-text text-transparent">de tu escuela infantil</span>
        </h1>
        <p className="text-body text-lg max-w-2xl mx-auto mb-10">
          Nido automatiza la contabilidad, facturación, comedor, empleados y nóminas de tu centro 0–3 años.
          <strong className="text-white/90"> Sin secretaria. Sin papeles. Sin preocupaciones.</strong>
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" onClick={() => setShowContact(true)}>Solicitar demo</Button>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">Ir al dashboard</Button>
          </Link>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="eyebrow mb-3">Funcionalidades</div>
          <h2 className="text-3xl font-bold text-white">Todo lo que necesitas, en un solo lugar</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} hover className="p-6">
              <div className="w-10 h-10 rounded-xl bg-coral-500/15 border border-coral-500/25 flex items-center justify-center text-coral-400 mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/60">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <Card className="p-10">
          <div className="eyebrow mb-3">Precios</div>
          <h2 className="text-3xl font-bold text-white mb-4">Planes pensados para tu centro</h2>
          <p className="text-body mb-8">Desde 149 €/mes. Sin permanencia. Sin sorpresas.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Starter", price: "149", desc: "Contabilidad + facturación básica", features: ["OCR facturas", "Libro de gastos", "Facturación SEPA"] },
              { name: "Growth", price: "249", desc: "Gestión escolar completa", features: ["Todo Starter", "Asistente IA", "Comedor + alérgenos", "Empleados + nóminas"] },
              { name: "Premium", price: "349", desc: "Previsiones + prioridad", features: ["Todo Growth", "Previsiones tesorería", "Suministros IA", "Soporte priority"] },
            ].map(p => (
              <div key={p.name} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
                <div className="text-xs font-bold uppercase tracking-wider text-coral-400 mb-1">{p.name}</div>
                <div className="text-3xl font-bold text-white mb-1">{p.price} <span className="text-base font-normal text-white/40">€/mes</span></div>
                <p className="text-xs text-white/50 mb-4">{p.desc}</p>
                <ul className="space-y-2 text-left text-sm text-white/60 mb-6">
                  {p.features.map((f, i) => <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-coral-400" />{f}</li>)}
                </ul>
                <Button size="sm" variant="primary" className="w-full" onClick={() => setShowContact(true)}>Elegir {p.name}</Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <footer className="px-6 py-10 border-t border-white/5 max-w-6xl mx-auto text-center text-xs text-white/30">
        Nido by Delega © {new Date().getFullYear()} · webdelega.netlify.app
      </footer>

      {showContact && <ContactForm onClose={() => setShowContact(false)} />}
    </div>
  );
}
