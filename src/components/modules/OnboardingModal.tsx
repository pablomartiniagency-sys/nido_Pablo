"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

interface SlideProps {
  titulo: string;
  descripcion: string;
  detalle: string;
  icono: string;
  color: string;
}

const PASOS: SlideProps[] = [
  {
    titulo: "Bienvenido a Nido",
    descripcion: "Tu secretaría digital para escuelas infantiles (0-3 años)",
    detalle: "Gestiona familias, facturas, gastos, empleados, alumnos y más desde un solo lugar. Todo lo que necesitas para administrar tu escuela infantil de forma digital y profesional.",
    icono: "🏫",
    color: "from-lapis-400 to-lapis-600",
  },
  {
    titulo: "Dashboard",
    descripcion: "Panel de control principal",
    detalle: "Aquí ves un resumen ejecutivo: ingresos, gastos del mes, morosos, alumnos activos y alertas inteligentes. Todo actualizado en tiempo real para que sepas la salud de tu escuela de un vistazo.",
    icono: "📊",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    titulo: "Familias",
    descripcion: "Registro de familias y servicios contratados",
    detalle: "Añade cada familia con sus datos de contacto, IBAN para domiciliación y los servicios que contratan (matrícula, mensualidad, comedor, extraescolares, etc.). Estos servicios se usan para generar facturas automáticamente.",
    icono: "👨‍👩‍👧‍👦",
    color: "from-coral-400 to-coral-600",
  },
  {
    titulo: "Facturación",
    descripcion: "Crea y gestiona facturas por familia",
    detalle: "Selecciona una familia, el período y los servicios — los importes se cargan automáticamente. Puedes marcar como pagada, impago, generar remesas SEPA para cobro por banco y enviar recordatorios por email.",
    icono: "💰",
    color: "from-amber-400 to-amber-600",
  },
  {
    titulo: "Contabilidad + OCR",
    descripcion: "Escanea facturas con IA",
    detalle: "Sube una foto de cualquier factura (JPG, PNG, PDF) y el sistema extrae automáticamente: proveedor, importe, IVA, fecha y categoría usando Google Vision + inteligencia artificial (Groq). También puedes crear asientos contables manuales para ajustes y amortizaciones.",
    icono: "📸",
    color: "from-purple-400 to-purple-600",
  },
  {
    titulo: "Alumnos",
    descripcion: "Perfil completo por alumno",
    detalle: "Cada alumno tiene su ficha con datos médicos (alergias, vacunas, medicación), contactos de emergencia, autorizaciones, documentos y registro de asistencia diaria. Ideal para tener toda la información a mano.",
    icono: "🎓",
    color: "from-blue-400 to-blue-600",
  },
  {
    titulo: "Empleados y Nóminas",
    descripcion: "Gestión del personal",
    detalle: "Registra empleados con su puesto, contrato, salario y genera nóminas automáticamente con cálculos de IRPF y Seguridad Social. Todo listo para la gestión laboral de tu escuela.",
    icono: "👥",
    color: "from-teal-400 to-teal-600",
  },
  {
    titulo: "Asistente IA",
    descripcion: "Consulta todo en lenguaje natural",
    detalle: "Escribe preguntas como \"¿Cuántas familias están en impago?\", \"Resumen de alumnos por curso\" o \"Recuérdame comprar material el viernes\". El asistente responde con datos reales de tu escuela y puede crear recordatorios automáticos.",
    icono: "🤖",
    color: "from-rose-400 to-rose-600",
  },
  {
    titulo: "Recordatorios",
    descripcion: "Cobros y tareas pendientes",
    detalle: "Envía recordatorios de pago por email a familias morosas, con dos modalidades: amable (cortesía) o aviso de impago. También verás aquí las tareas que crees desde el Asistente IA.",
    icono: "🔔",
    color: "from-red-400 to-red-600",
  },
  {
    titulo: "¡Listo para empezar!",
    descripcion: "Tu escuela digital te espera",
    detalle: "Empieza configurando tu centro en Ajustes, después añade familias, alumnos y empleados. Usa el Asistente IA si tienes dudas. El botón de ayuda (?) siempre está disponible abajo a la derecha.",
    icono: "🚀",
    color: "from-lapis-500 to-coral-500",
  },
];

export function OnboardingModal() {
  const { user } = useAuth();
  const [paso, setPaso] = useState(0);
  const [open, setOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const hablar = useCallback((texto: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

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

  useEffect(() => {
    if (open) {
      const p = PASOS[paso];
      hablar(`${p.titulo}. ${p.descripcion}. ${p.detalle}`);
    }
    return () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
  }, [paso, open, hablar]);

  const siguiente = () => {
    if (paso < PASOS.length - 1) {
      setPaso(p => p + 1);
    } else {
      setOpen(false);
      setPaso(0);
    }
  };

  const anterior = () => {
    if (paso > 0) setPaso(p => p - 1);
  };

  const replayVoice = () => {
    const p = PASOS[paso];
    hablar(`${p.titulo}. ${p.descripcion}. ${p.detalle}`);
  };

  if (!open) return null;

  const p = PASOS[paso];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => {}}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { window.speechSynthesis?.cancel(); setOpen(false); setPaso(0); }} />
      <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${p.color} px-8 pt-10 pb-16 text-white text-center relative`}>
          <div className="text-5xl mb-4">{p.icono}</div>
          <h2 className="text-2xl font-bold mb-2 text-white">{p.titulo}</h2>
          <p className="text-sm text-white/80">{p.descripcion}</p>
          <button
            onClick={() => { window.speechSynthesis?.cancel(); setOpen(false); setPaso(0); }}
            className="absolute top-4 right-4 text-white/50 hover:text-white text-xl leading-none"
          >&times;</button>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {PASOS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${
                i === paso ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30"
              }`} />
            ))}
          </div>
          <div className="absolute -bottom-3 left-0 right-0 h-6 bg-white rounded-t-3xl" />
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-sm text-ink-600 leading-relaxed">{p.detalle}</p>

          {/* Voice control */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={replayVoice}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
                  speaking
                    ? "bg-lapis-50 text-lapis-600 border-lapis-200"
                    : "bg-gray-50 text-ink-500 border-gray-200 hover:bg-gray-100"
                }`}
                title="Repetir voz"
              >
                <span className={speaking ? "animate-pulse" : ""}>🔊</span>
                {speaking ? "Hablando..." : "Sonido"}
              </button>
              <label className="flex items-center gap-1.5 text-xs text-ink-400 cursor-pointer">
                <input type="checkbox" checked={voiceEnabled} onChange={e => { setVoiceEnabled(e.target.checked); if (!e.target.checked) window.speechSynthesis?.cancel(); }} className="rounded border-gray-300" />
                Voz guiada
              </label>
            </div>
            <span className="text-xs text-ink-400 font-medium">{paso + 1} / {PASOS.length}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex gap-2">
          <button onClick={() => { window.speechSynthesis?.cancel(); setOpen(false); setPaso(0); }}
            className="flex-1 py-2.5 text-xs font-medium text-ink-400 hover:text-ink-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
            Saltar tour
          </button>
          {paso > 0 && (
            <button onClick={anterior}
              className="px-5 py-2.5 text-xs font-medium text-ink-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition">
              Anterior
            </button>
          )}
          <button onClick={siguiente}
            className={`flex-1 py-2.5 text-xs font-medium text-white rounded-xl transition shadow-sm ${
              paso === PASOS.length - 1
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                : `bg-gradient-to-r ${p.color} hover:opacity-90`
            }`}>
            {paso === PASOS.length - 1 ? "🚀 Comenzar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
