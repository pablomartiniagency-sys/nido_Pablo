"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/landing/ContactForm";
import { Card } from "@/components/ui/Card";
import { IconAccounting, IconInvoice, IconChat, IconBolt, IconBowl, IconUsers } from "@/components/ui/Icons";
import { useState, useEffect } from "react";

const FEATURES = [
  { icon: <IconAccounting width={20} height={20} />, title: "Contabilidad", desc: "OCR de facturas, clasificación automática y libro de gastos." },
  { icon: <IconInvoice width={20} height={20} />, title: "Facturación SEPA", desc: "Generación de remesas ISO 20022 pain.008.001.02." },
  { icon: <IconChat width={20} height={20} />, title: "Asistente IA", desc: "Consulta tus datos en lenguaje natural." },
  { icon: <IconBolt width={20} height={20} />, title: "Previsiones", desc: "Proyección de tesorería 3M con regresión lineal." },
  { icon: <IconBowl width={20} height={20} />, title: "Seguimiento de clientes", desc: "CRM comercial con pipeline de leads y oportunidades." },
  { icon: <IconUsers width={20} height={20} />, title: "Empleados", desc: "Plantilla, ratios, incidencias y nóminas." },
];

export default function LandingPage() {
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 1440 1024" fill="none" preserveAspectRatio="xMidYMid slice">
          {/* Nidos */}
          <g transform="translate(160, 790)" opacity="0.25">
            <path d="M-24,0 C-20,22 -8,28 0,28 C8,28 20,22 24,0" fill="none" stroke="#A5C8E8" strokeWidth="1.1" />
            <path d="M-16,4 C-10,19 -4,23 0,23 C4,23 10,19 16,4" fill="none" stroke="#A5C8E8" strokeWidth="0.8" />
          </g>
          <g transform="translate(680, 860)" opacity="0.2">
            <path d="M-20,0 C-16,19 -7,24 0,24 C7,24 16,19 20,0" fill="none" stroke="#71A8D9" strokeWidth="1" />
            <path d="M-13,3 C-8,16 -3,20 0,20 C3,20 8,16 13,3" fill="none" stroke="#71A8D9" strokeWidth="0.7" />
          </g>
          <g transform="translate(1150, 740)" opacity="0.22">
            <path d="M-22,0 C-18,21 -8,27 0,27 C8,27 18,21 22,0" fill="none" stroke="#A5D4E8" strokeWidth="1.1" />
            <path d="M-14,4 C-9,18 -3,22 0,22 C3,22 9,18 14,4" fill="none" stroke="#A5D4E8" strokeWidth="0.8" />
          </g>

          {/* Flores */}
          <g transform="translate(380, 220)" opacity="0.3">
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(0)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(72)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(144)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(216)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#CEE1F2" transform="rotate(288)" />
          </g>
          <g transform="translate(940, 160)" opacity="0.25">
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(0)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(72)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(144)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(216)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(288)" />
          </g>
          <g transform="translate(200, 450)" opacity="0.2">
            <path d="M0,-3 C3,-3 5,-0.5 5,3 C5,5.5 3,7 0,7 C-3,7 -5,5.5 -5,3 C-5,-0.5 -3,-3 0,-3Z" fill="#90B4D6" transform="rotate(0)" />
            <path d="M0,-3 C3,-3 5,-0.5 5,3 C5,5.5 3,7 0,7 C-3,7 -5,5.5 -5,3 C-5,-0.5 -3,-3 0,-3Z" fill="#90B4D6" transform="rotate(72)" />
            <path d="M0,-3 C3,-3 5,-0.5 5,3 C5,5.5 3,7 0,7 C-3,7 -5,5.5 -5,3 C-5,-0.5 -3,-3 0,-3Z" fill="#90B4D6" transform="rotate(144)" />
            <path d="M0,-3 C3,-3 5,-0.5 5,3 C5,5.5 3,7 0,7 C-3,7 -5,5.5 -5,3 C-5,-0.5 -3,-3 0,-3Z" fill="#90B4D6" transform="rotate(216)" />
            <path d="M0,-3 C3,-3 5,-0.5 5,3 C5,5.5 3,7 0,7 C-3,7 -5,5.5 -5,3 C-5,-0.5 -3,-3 0,-3Z" fill="#90B4D6" transform="rotate(288)" />
          </g>
          <g transform="translate(1240, 420)" opacity="0.28">
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#C4E0F0" transform="rotate(0)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#C4E0F0" transform="rotate(72)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#C4E0F0" transform="rotate(144)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#C4E0F0" transform="rotate(216)" />
            <path d="M0,-4 C4,-4 7,-1 7,4 C7,7 4,9 0,9 C-4,9 -7,7 -7,4 C-7,-1 -4,-4 0,-4Z" fill="#C4E0F0" transform="rotate(288)" />
          </g>
          <g transform="translate(780, 600)" opacity="0.22">
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(0)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(72)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(144)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(216)" />
            <path d="M0,-3.5 C3.5,-3.5 6,-0.5 6,3.5 C6,6.5 3.5,8 0,8 C-3.5,8 -6,6.5 -6,3.5 C-6,-0.5 -3.5,-3.5 0,-3.5Z" fill="#A5C8E8" transform="rotate(288)" />
          </g>

          {/* Soles */}
          <g transform="translate(580, 110)" opacity="0.25">
            <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#A5C8E8" />
            <line x1="0" y1="-9" x2="0" y2="-13" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="9" y1="0" x2="13" y2="0" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="0" y1="9" x2="0" y2="13" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="-9" y1="0" x2="-13" y2="0" stroke="#A5C8E8" strokeWidth="1" strokeLinecap="round" />
            <line x1="6.5" y1="-6.5" x2="9" y2="-9" stroke="#A5C8E8" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="6.5" y1="6.5" x2="9" y2="9" stroke="#A5C8E8" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="-6.5" y1="6.5" x2="-9" y2="9" stroke="#A5C8E8" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="-6.5" y1="-6.5" x2="-9" y2="-9" stroke="#A5C8E8" strokeWidth="0.7" strokeLinecap="round" />
          </g>
          <g transform="translate(1090, 300)" opacity="0.28">
            <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill="#C4E0F0" />
            <line x1="0" y1="-8" x2="0" y2="-12" stroke="#C4E0F0" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="8" y1="0" x2="12" y2="0" stroke="#C4E0F0" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="0" y1="8" x2="0" y2="12" stroke="#C4E0F0" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="-8" y1="0" x2="-12" y2="0" stroke="#C4E0F0" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="5.5" y1="-5.5" x2="8" y2="-8" stroke="#C4E0F0" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="5.5" y1="5.5" x2="8" y2="8" stroke="#C4E0F0" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5.5" y1="5.5" x2="-8" y2="8" stroke="#C4E0F0" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5.5" y1="-5.5" x2="-8" y2="-8" stroke="#C4E0F0" strokeWidth="0.6" strokeLinecap="round" />
          </g>
          <g transform="translate(280, 600)" opacity="0.22">
            <rect x="-2" y="-2" width="4" height="4" rx="1" fill="#CEE1F2" />
            <line x1="0" y1="-7" x2="0" y2="-10" stroke="#CEE1F2" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="7" y1="0" x2="10" y2="0" stroke="#CEE1F2" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="0" y1="7" x2="0" y2="10" stroke="#CEE1F2" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="-7" y1="0" x2="-10" y2="0" stroke="#CEE1F2" strokeWidth="0.9" strokeLinecap="round" />
            <line x1="5" y1="-5" x2="7" y2="-7" stroke="#CEE1F2" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="5" y1="5" x2="7" y2="7" stroke="#CEE1F2" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5" y1="5" x2="-7" y2="7" stroke="#CEE1F2" strokeWidth="0.6" strokeLinecap="round" />
            <line x1="-5" y1="-5" x2="-7" y2="-7" stroke="#CEE1F2" strokeWidth="0.6" strokeLinecap="round" />
          </g>

          {/* Ondas */}
          <path d="M0 930 Q200 895 400 930 T800 930 T1200 930 T1440 930" stroke="#A5C8E8" strokeWidth="0.6" opacity="0.15" fill="none" />
          <path d="M0 960 Q250 925 500 960 T1000 960 T1440 960" stroke="#90B4D6" strokeWidth="0.5" opacity="0.12" fill="none" />
        </svg>
      </div>
      <div className="min-h-screen bg-grid bg-glow relative">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Logo href="/" />
        <Button size="sm" onClick={() => setShowContact(true)}>Solicitar demo</Button>
      </header>

      <section className="px-6 pt-20 pb-24 max-w-4xl mx-auto text-center">
        <div className="eyebrow mb-4">Delega · Producto SaaS</div>
        <h1 className="h-display mb-6">
          El asistente de tu escuela infantil<br />
          <span className="bg-gradient-to-r from-coral-300 to-coral-500 bg-clip-text text-transparent">de tu escuela infantil</span>
        </h1>
        <p className="text-body text-lg max-w-2xl mx-auto mb-10">
          Nido automatiza la contabilidad, facturación, comedor, empleados y nóminas de tu centro 0–3 años.
          <strong className="text-ink-800"> Todo lo que tu escuela necesita en un solo lugar.</strong>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login"><Button size="lg" variant="primary">Iniciar sesión</Button></Link>
          <Button size="lg" variant="secondary" onClick={() => setShowContact(true)}>Solicitar demo</Button>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="eyebrow mb-3">Funcionalidades</div>
          <h2 className="text-3xl font-bold text-ink-900">Todo lo que necesitas, en un solo lugar</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} hover className="p-6">
              <div className="w-10 h-10 rounded-xl bg-coral-500/15 border border-coral-500/25 flex items-center justify-center text-coral-400 mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold text-ink-900 mb-2">{f.title}</h3>
              <p className="text-sm text-ink-500">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-ink-200 max-w-6xl mx-auto text-center text-xs text-ink-400">
        Nido by Delega © {new Date().getFullYear()}
      </footer>

      {showContact && <ContactForm onClose={() => setShowContact(false)} />}
    </div>
    </>
  );
}
