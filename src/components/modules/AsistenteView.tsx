"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, genId } from "@/lib/data/useStore";
import { IconSend } from "@/components/ui/Icons";
import type { Tarea } from "@/types";

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
  "Recuérdame comprar material el viernes",
  "Crea un recordatorio para reunión de padres",
];

export default function AsistenteView() {
  const store = useStore();
  const { ready, addTarea } = store;

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: "assistant", content: "¡Hola! Soy el asistente IA de Nido. Pregúntame sobre tus alumnos, facturas, gastos, empleados o cualquier aspecto de tu escuela. También puedo crear recordatorios si me lo pides." },
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
      let reply = data.reply || "Lo siento, no pude procesar tu consulta. Intenta de nuevo.";

      if (reply.startsWith("__ACCION__:crear_tarea|")) {
        const partes = reply.split("\n")[0].split("|");
        const titulo = decodeURIComponent(partes[1] || "Tarea pendiente");
        const fecha = decodeURIComponent(partes[2] || "");
        const nuevaTarea: Tarea = {
          id: genId("tar"),
          titulo,
          descripcion: `Creado desde el asistente: ${msg}`,
          fecha: fecha || undefined,
          completada: false,
          creadaPor: "ia",
          createdAt: new Date().toISOString(),
        };
        addTarea(nuevaTarea);
        reply = reply.replace(/^__ACCION__:crear_tarea\|[^|]*\|[^|]*\n\n/, "");
      }

      setMensajes(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMensajes(prev => [...prev, { role: "assistant", content: "Error de conexión. Verifica que el servidor esté funcionando." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-lapis-600">Asistente IA</h2>
        <p className="text-sm text-ink-500">Consulta tus datos o crea recordatorios en lenguaje natural</p>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-coral-50 border border-coral-200 text-ink-900"
                  : "bg-gray-50 border border-gray-200 text-ink-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-coral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-coral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-coral-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {!primerMensajeEnviado && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                onClick={() => enviarMensaje(s)}
                className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-ink-700 hover:border-coral-300 hover:bg-gray-50 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(input); } }}
          placeholder="Escribe tu pregunta..."
          disabled={loading || !ready}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-lapis-400/60 disabled:opacity-50"
        />
        <button
          onClick={() => enviarMensaje(input)}
          disabled={loading || !input.trim() || !ready}
          className="px-4 py-3 bg-lapis-500 text-white rounded-xl hover:bg-lapis-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-lapis-500/20"
        >
          <IconSend width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
