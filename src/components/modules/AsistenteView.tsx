"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/data/useStore";
import { IconSend } from "@/components/ui/Icons";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "¿Cuántas familias están en impago?",
  "Resumen de alumnos por curso",
  "¿Cuál es el EBITDA?",
  "Gastos por categoría",
  "¿Cuántos empleados tengo?",
  "Resumen general de la escuela",
];

export default function AsistenteView() {
  const store = useStore();
  const { ready } = store;

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: "assistant", content: "¡Hola! Soy el asistente IA de Nido. Pregúntame sobre tus alumnos, facturas, gastos, empleados o cualquier aspecto de tu escuela." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [primerMensajeEnviado, setPrimerMensajeEnviado] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || loading) return;
    const msg = texto.trim();

    setMensajes(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    setPrimerMensajeEnviado(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: mensajes.map(m => ({ role: m.role, content: m.content })),
          data: {
            familias: store.familias,
            facturas: store.facturas,
            gastos: store.gastos,
            empleados: store.empleados,
            alumnos: store.alumnos,
            leads: store.leads,
            incidencias: store.incidencias,
          },
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMensajes(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMensajes(prev => [...prev, { role: "assistant", content: "Lo siento, no pude procesar tu consulta. Intenta de nuevo." }]);
      }
    } catch {
      setMensajes(prev => [...prev, { role: "assistant", content: "Error de conexión. Verifica que el servidor esté funcionando." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Asistente IA</h2>
        <p className="text-sm text-charcoal-400">Consulta tus datos en lenguaje natural</p>
      </div>

      {/* Chat */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth"
      >
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-coral-500/20 border border-coral-500/30 text-ink-900"
                  : "bg-charcoal-800/50 border border-charcoal-700/50 text-charcoal-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-charcoal-800/50 border border-charcoal-700/50 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-coral-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-coral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-coral-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Sugerencias */}
        {!primerMensajeEnviado && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                onClick={() => enviarMensaje(s)}
                className="text-left px-4 py-3 bg-charcoal-800/30 border border-charcoal-700/50 rounded-xl text-sm text-charcoal-300 hover:border-coral-500/30 hover:bg-charcoal-800/50 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(input); } }}
          placeholder="Escribe tu pregunta..."
          disabled={loading || !ready}
          className="flex-1 px-4 py-3 bg-charcoal-800/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50 disabled:opacity-50"
        />
        <button
          onClick={() => enviarMensaje(input)}
          disabled={loading || !input.trim() || !ready}
          className="px-4 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSend width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
