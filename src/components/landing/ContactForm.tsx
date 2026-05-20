"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ContactForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", center: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast("Nombre y email requeridos", "error"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        toast(data.enviado ? "✅ Email recibido — te escribimos en 24h." : "✅ Solicitud registrada — revisa la app para ver los leads.");
        if (!data.enviado) {
          toast("⚠️ Email no configurado en Netlify. Ve a Configuración → Email y añade SMTP_PASS.", "info");
        }
      } else {
        toast(data.error || "Error al enviar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-ink-700 border border-white/10 p-6 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{sent ? "¡Recibido!" : "Solicitar demo"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">&times;</button>
        </div>
        {sent ? (
          <p className="text-sm text-white/70">Gracias por tu interés. En menos de 24h te enviamos acceso a la demo.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="input" placeholder="Nombre completo *" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input className="input" type="email" placeholder="Email profesional *" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input className="input" placeholder="Teléfono" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input className="input" placeholder="Nombre del centro" value={form.center} onChange={e => setForm(p => ({ ...p, center: e.target.value }))} />
            <textarea className="textarea h-24" placeholder="¿Cuántos alumnos tenéis? ¿Qué necesitas?" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
            <Button type="submit" className="w-full" disabled={sending}>{sending ? "Enviando..." : "Enviar solicitud"}</Button>
            <p className="text-[10px] text-white/20 text-center">
              Al enviar aceptas el tratamiento de tus datos según la <a href="/privacidad" className="text-coral-400/60 hover:text-coral-400" target="_blank">política de privacidad</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
