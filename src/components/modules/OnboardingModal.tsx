"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

const PASOS = [
  { titulo: "Bienvenido a Nido 🏫", descripcion: "Tu secretaría digital para la escuela infantil. Gestiona familias, facturas, empleados y más desde un solo lugar." },
  { titulo: "Dashboard", descripcion: "El panel principal te muestra un resumen de ingresos, gastos, morosos y métricas clave de tu escuela." },
  { titulo: "Familias y Facturación", descripcion: "Registra familias, genera facturas y gestiona cobros. Los recordatorios se envían automáticamente por email." },
  { titulo: "Contabilidad + OCR", descripcion: "Sube fotos de facturas y el sistema extrae automáticamente proveedor, importe e IVA mediante Google Vision." },
  { titulo: "Alumnos y Asistencia", descripcion: "Perfil completo por alumno con datos médicos, contactos de emergencia y registro de asistencia diaria." },
  { titulo: "Séneca (Andalucía)", descripcion: "Genera informes de evaluación para el sistema Séneca de la Junta de Andalucía. Actívalo en Configuración." },
  { titulo: "Asistente IA", descripcion: "Pregunta cualquier cosa sobre tu escuela: morosos, gastos, empleados, capacidad... El asistente responde con datos reales." },
  { titulo: "¿Listo para empezar?", descripcion: "Configura tu centro en Ajustes, añade familias y empieza a gestionar tu escuela digitalmente." },
];

export function OnboardingModal() {
  const { user } = useAuth();
  const [paso, setPaso] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `nido-onboarding-${user.id}`;
    try {
      if (!localStorage.getItem(key)) {
        setOpen(true);
        localStorage.setItem(key, "done");
      }
    } catch {}
  }, [user]);

  if (!open) return null;

  const p = PASOS[paso];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => { setOpen(false); setPaso(0); }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl bg-ink-700 border border-white/10 p-8 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-white/30">{paso + 1} / {PASOS.length}</span>
          <button onClick={() => { setOpen(false); setPaso(0); }} className="text-white/30 hover:text-white text-lg leading-none">&times;</button>
        </div>
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{p.titulo}</h2>
          <p className="text-sm text-white/60 leading-relaxed">{p.descripcion}</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {PASOS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition ${i === paso ? "bg-coral-400 w-3" : "bg-white/20"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setOpen(false); setPaso(0); }} className="flex-1 text-xs text-white/40 hover:text-white py-2">Saltar</button>
          {paso < PASOS.length - 1 ? (
            <button onClick={() => setPaso(p => p + 1)} className="flex-1 rounded-xl bg-coral-500 hover:bg-coral-400 text-white text-sm font-medium py-2 transition">Siguiente</button>
          ) : (
            <button onClick={() => { setOpen(false); setPaso(0); }} className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium py-2 transition">Comenzar</button>
          )}
        </div>
      </div>
    </div>
  );
}
