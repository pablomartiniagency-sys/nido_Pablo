"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import { IconSend, IconAlert, IconCheck, IconRefresh, IconSparkles } from "@/components/ui/Icons";
import { eur } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { CargoPendiente } from "@/types";

interface HistorialRecordatorio {
  id: string;
  familiaId: string;
  familiaNombre: string;
  fecha: string;
  tipo: "cortesia" | "impago";
  total: number;
  enviado: boolean;
}

export default function RecordatoriosView() {
  const { facturas, familias, cargosPendientes } = useStore();
  const { toast } = useToast();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [historial, setHistorial] = useState<HistorialRecordatorio[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftFamiliaId, setDraftFamiliaId] = useState<string | null>(null);
  const [draftTipo, setDraftTipo] = useState<"cortesia" | "impago">("cortesia");
  const [draftEdited, setDraftEdited] = useState({ asunto: "", cuerpo: "" });

  const familiasMorosas = useMemo(() => {
    const grouped = new Map<string, {
      familia: typeof familias[0];
      facturas: typeof facturas;
      cargos: CargoPendiente[];
      total: number;
    }>();

    facturas.filter(f => f.estado === "impago" || f.estado === "enviada").forEach(f => {
      const familia = familias.find(fa => fa.id === f.familiaId);
      if (!familia) return;
      const existing = grouped.get(f.familiaId);
      if (existing) {
        existing.facturas.push(f);
        existing.total += f.total;
      } else {
        grouped.set(f.familiaId, { familia, facturas: [f], cargos: [], total: f.total });
      }
    });

    cargosPendientes.filter(c => c.estado === "pendiente").forEach(c => {
      const familia = familias.find(fa => fa.id === c.familiaId);
      if (!familia) return;
      const existing = grouped.get(c.familiaId);
      if (existing) {
        existing.cargos.push(c);
        existing.total += c.importe;
      } else {
        grouped.set(c.familiaId, { familia, facturas: [], cargos: [c], total: c.importe });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }, [facturas, familias, cargosPendientes]);

  const totalMoroso = familiasMorosas.reduce((s, f) => s + f.total, 0);
  const totalFacturasPendientes = familiasMorosas.reduce((s, f) => s + f.facturas.length, 0);
  const totalCargosPendientes = familiasMorosas.reduce((s, f) => s + f.cargos.length, 0);

  const enviarRecordatorio = async (familiaId: string, tipo: "cortesia" | "impago") => {
    const grupo = familiasMorosas.find(f => f.familia.id === familiaId);
    if (!grupo) return;

    setSendingId(familiaId);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/recordatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familiaNombre: grupo.familia.nombre,
          familiaEmail: grupo.familia.email,
          facturas: grupo.facturas.map(f => ({
            numero: f.numero,
            periodo: f.periodo,
            total: f.total,
          })),
          cargos: grupo.cargos.map(c => ({
            concepto: c.concepto,
            alumnoNombre: c.alumnoNombre,
            importe: c.importe,
            fechaVencimiento: c.fechaVencimiento,
          })),
          tipo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ ok: true, msg: data.message || "Recordatorio enviado" });
        setHistorial(prev => [{
          id: `rec-${Date.now()}`,
          familiaId: grupo.familia.id,
          familiaNombre: grupo.familia.nombre,
          fecha: new Date().toLocaleString("es-ES"),
          tipo,
          total: grupo.total,
          enviado: true,
        }, ...prev]);
      } else {
        setStatusMsg({ ok: false, msg: data.error || "Error al enviar" });
      }
    } catch {
      setStatusMsg({ ok: false, msg: "Error de conexión. El recordatorio se ha registrado localmente." });
      setHistorial(prev => [{
        id: `rec-${Date.now()}`,
        familiaId: grupo.familia.id,
        familiaNombre: grupo.familia.nombre,
        fecha: new Date().toLocaleString("es-ES"),
        tipo,
        total: grupo.total,
        enviado: false,
      }, ...prev]);
    } finally {
      setSendingId(null);
    }
  };

  const generarBorrador = async (familiaId: string, tipo: "cortesia" | "impago") => {
    const grupo = familiasMorosas.find(f => f.familia.id === familiaId);
    if (!grupo) return;

    setDraftLoading(true);
    setDraftFamiliaId(familiaId);
    setDraftTipo(tipo);
    setShowDraftModal(true);
    setDraftEdited({ asunto: "", cuerpo: "" });

    try {
      const res = await fetch("/api/recordatorios/borrador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familiaNombre: grupo.familia.nombre,
          familiaEmail: grupo.familia.email,
          facturas: grupo.facturas.map(f => ({
            numero: f.numero,
            periodo: f.periodo,
            total: f.total,
          })),
          cargos: grupo.cargos.map(c => ({
            concepto: c.concepto,
            alumnoNombre: c.alumnoNombre,
            importe: c.importe,
          })),
          tipo,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraftEdited(data.draft);
      } else {
        toast("No se pudo generar el borrador", "error");
      }
    } catch {
      toast("Error al generar borrador", "error");
    } finally {
      setDraftLoading(false);
    }
  };

  const enviarBorrador = async () => {
    if (!draftFamiliaId || !draftEdited.asunto) return;
    const grupo = familiasMorosas.find(f => f.familia.id === draftFamiliaId);
    if (!grupo) return;

    setSendingId(draftFamiliaId);
    try {
      const res = await fetch("/api/recordatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familiaNombre: grupo.familia.nombre,
          familiaEmail: grupo.familia.email,
          facturas: grupo.facturas.map(f => ({ numero: f.numero, periodo: f.periodo, total: f.total })),
          cargos: grupo.cargos.map(c => ({ concepto: c.concepto, alumnoNombre: c.alumnoNombre, importe: c.importe, fechaVencimiento: c.fechaVencimiento })),
          tipo: draftTipo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Recordatorio enviado");
        setHistorial(prev => [{
          id: `rec-${Date.now()}`, familiaId: grupo.familia.id, familiaNombre: grupo.familia.nombre,
          fecha: new Date().toLocaleString("es-ES"), tipo: draftTipo, total: grupo.total, enviado: true,
        }, ...prev]);
        setShowDraftModal(false);
      } else {
        toast(data.error || "Error al enviar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Recordatorios de pago</h2>
        <p className="text-sm text-ink-500">{familiasMorosas.length} familias con pagos pendientes · {totalFacturasPendientes} facturas · {totalCargosPendientes} cargos · {eur(totalMoroso)} total</p>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
          statusMsg.ok ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {statusMsg.ok ? <IconCheck /> : <IconAlert />}
          {statusMsg.msg}
        </div>
      )}

      {familiasMorosas.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <IconCheck width={48} height={48} className="mx-auto mb-3 text-emerald-600" />
          <p className="text-lg font-medium text-emerald-600">¡Todo al día!</p>
          <p className="text-sm text-ink-500 mt-1">No hay familias con pagos pendientes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {familiasMorosas.map(grupo => (
            <div key={grupo.familia.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{grupo.familia.nombre}</h3>
                  <p className="text-sm text-ink-500">{grupo.familia.email}</p>
                  <p className="text-sm text-ink-500">{grupo.familia.alumnos.length} alumnos</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{eur(grupo.total)}</p>
                  <p className="text-xs text-ink-400">{grupo.facturas.length} facturas · {grupo.cargos.length} cargos pendientes</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {grupo.facturas.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${f.estado === "impago" ? "bg-red-500" : "bg-amber-500"}`} />
                      <div>
                        <p className="text-sm font-medium">{f.numero}</p>
                        <p className="text-xs text-ink-400">{f.items?.[0]?.concepto || f.periodo} · {f.periodo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{eur(f.total)}</p>
                      <p className={`text-xs ${f.estado === "impago" ? "text-red-600" : "text-amber-600"}`}>{f.estado === "impago" ? "Vencida" : "Pendiente"}</p>
                    </div>
                  </div>
                ))}
                {grupo.cargos.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${c.fechaVencimiento < new Date().toISOString().slice(0, 10) ? "bg-red-500" : "bg-amber-500"}`} />
                      <div>
                        <p className="text-sm font-medium">{c.concepto}</p>
                        <p className="text-xs text-ink-400">{c.alumnoNombre} · Vence: {c.fechaVencimiento}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{eur(c.importe)}</p>
                      <p className={`text-xs ${c.fechaVencimiento < new Date().toISOString().slice(0, 10) ? "text-red-600" : "text-amber-600"}`}>
                        {c.fechaVencimiento < new Date().toISOString().slice(0, 10) ? "Vencido" : "Pendiente"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => generarBorrador(grupo.familia.id, "cortesia")}
                  disabled={draftLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors text-sm disabled:opacity-50"
                >
                  <IconSparkles width={14} height={14} />
                  Borrador IA
                </button>
                <button
                  onClick={() => enviarRecordatorio(grupo.familia.id, "cortesia")}
                  disabled={sendingId === grupo.familia.id}
                  className="flex items-center gap-2 px-4 py-2 bg-coral-50 text-coral-500 border border-coral-200 rounded-xl hover:bg-coral-100 transition-colors text-sm disabled:opacity-50"
                >
                  {sendingId === grupo.familia.id ? <IconRefresh className="animate-spin" /> : <IconSend />}
                  Recordatorio amable
                </button>
                <button
                  onClick={() => enviarRecordatorio(grupo.familia.id, "impago")}
                  disabled={sendingId === grupo.familia.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  {sendingId === grupo.familia.id ? <IconRefresh className="animate-spin" /> : <IconAlert />}
                  Aviso impago
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showDraftModal} onClose={() => setShowDraftModal(false)} title="Borrador con IA">
        <div className="space-y-4">
          {draftLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconRefresh className="animate-spin" width={24} height={24} />
              <span className="ml-3 text-ink-500">Generando borrador...</span>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">Asunto</label>
                <input className="input w-full" value={draftEdited.asunto} onChange={e => setDraftEdited(p => ({ ...p, asunto: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-700">Cuerpo del email</label>
                <textarea className="textarea h-48" value={draftEdited.cuerpo} onChange={e => setDraftEdited(p => ({ ...p, cuerpo: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (draftFamiliaId) generarBorrador(draftFamiliaId, draftTipo);
                }}><IconRefresh width={14} height={14} /> Regenerar</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowDraftModal(false)}>Cancelar</Button>
                <Button size="sm" onClick={enviarBorrador} disabled={sendingId !== null}>
                  {sendingId ? <IconRefresh className="animate-spin" /> : <IconSend />} Enviar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Últimos recordatorios enviados</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-ink-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Familia</th>
                  <th className="text-left px-4 py-3 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(h => (
                  <tr key={h.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-ink-500">{h.fecha}</td>
                    <td className="px-4 py-3 font-medium">{h.familiaNombre}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${h.tipo === "cortesia" ? "bg-coral-50 text-coral-500" : "bg-red-50 text-red-600"}`}>
                        {h.tipo === "cortesia" ? "Cortesía" : "Impago"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{h.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                    <td className="px-4 py-3">
                      {h.enviado ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-1"><IconCheck width={12} height={12}/> Enviado</span>
                      ) : (
                        <span className="text-amber-600 text-xs flex items-center gap-1"><IconAlert width={12} height={12}/> No enviado (demo)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
