"use client";

import { useState } from "react";
import { IconX } from "@/components/ui/Icons";

const FAGS = [
  { q: "¿Cómo añadir una familia?", r: "Ve a Familias → Añadir familia. Rellena nombre, email, IBAN y servicios contratados." },
  { q: "¿Cómo generar una factura?", r: "En Facturación → Nueva factura, selecciona la familia, los servicios y el período. Puedes descargar el PDF o generar SEPA." },
  { q: "¿Cómo escanear una factura con OCR?", r: "En Contabilidad → OCR Factura, arrastra una imagen JPG/PNG y el sistema extrae proveedor, importe e IVA automáticamente." },
  { q: "¿Cómo funciona el Asistente IA?", r: "Escribe preguntas en lenguaje natural como \"¿Cuántos morosos hay?\" o \"¿Cuál fue el gasto total este mes?\"." },
  { q: "¿Qué es Séneca?", r: "Es el sistema de la Junta de Andalucía. Actívalo en Configuración → Datos del centro seleccionando Andalucía, y genera informes de evaluación." },
  { q: "¿Cómo crear usuarios secundarios?", r: "Solo el propietario puede hacerlo en Configuración → Usuarios secundarios → Añadir. Útil para educadores o personal administrativo." },
  { q: "¿Los datos se guardan al cerrar sesión?", r: "Sí, los datos se guardan automáticamente en tu navegador (localStorage). Si usas demo, se pierden al cerrar." },
  { q: "¿Cómo configurar el envío de emails?", r: "En Configuración → Email (SMTP), prueba la conexión. Los recordatorios de pago se envían automáticamente." },
];

export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const filtrados = FAGS.filter(f => f.q.toLowerCase().includes(busqueda.toLowerCase()) || f.r.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-coral-500 hover:bg-coral-400 text-white shadow-lg flex items-center justify-center text-lg font-bold transition">?</button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl bg-ink-700 border border-white/10 p-6 shadow-2xl animate-fadeIn flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Ayuda rápida</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><IconX width={16} height={16} /></button>
            </div>
            <input className="input mb-4" placeholder="Buscar ayuda..." value={busqueda} onChange={e => setBusqueda(e.target.value)} autoFocus />
            <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {filtrados.map((f, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer text-sm text-white/80 hover:text-white py-2 px-3 rounded-xl hover:bg-white/[0.04] transition">{f.q}</summary>
                  <p className="text-xs text-white/50 px-3 pb-3 pt-1 leading-relaxed">{f.r}</p>
                </details>
              ))}
              {filtrados.length === 0 && <p className="text-sm text-white/40 text-center py-8">No se encontraron resultados</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
