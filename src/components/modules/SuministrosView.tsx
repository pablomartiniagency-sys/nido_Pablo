"use client";

import { useState, useMemo } from "react";
import { useStore, genId } from "@/lib/data/useStore";
import { eur } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus } from "@/components/ui/Icons";
import type { SuministroFactura } from "@/types";

const TIPOS = ["electricidad", "agua", "internet", "gas", "telefonia"] as const;

export function SuministrosView() {
  const { suministros, addSuministro } = useStore();
  const { toast } = useToast();
  const [tipoActivo, setTipoActivo] = useState<string>("electricidad");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ proveedor: "", periodo: "", consumo: "", importe: "", fecha: new Date().toISOString().split("T")[0] });

  const filtrados = useMemo(() => suministros.filter(s => s.tipo === tipoActivo), [suministros, tipoActivo]);

  const handleSubmit = () => {
    if (!form.proveedor || !form.periodo || !form.importe || !form.fecha) { toast("Completa todos los campos", "error"); return; }
    const newS: SuministroFactura = {
      id: genId("sum"),
      tipo: tipoActivo as SuministroFactura["tipo"],
      proveedor: form.proveedor,
      periodo: form.periodo,
      consumo: parseFloat(form.consumo) || 0,
      unidad: tipoActivo === "electricidad" ? "kWh" : tipoActivo === "agua" ? "m³" : "---",
      importe: parseFloat(form.importe),
      fecha: form.fecha,
    };
    addSuministro(newS);
    toast(`Factura de ${form.proveedor} registrada`);
    setShowModal(false);
    setForm({ proveedor: "", periodo: "", consumo: "", importe: "", fecha: new Date().toISOString().split("T")[0] });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Suministros" description="Histórico de facturas de suministros"
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}><IconPlus width={14} height={14} /> Nueva factura</Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {TIPOS.map(t => (
          <button key={t} onClick={() => setTipoActivo(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
              tipoActivo === t ? "bg-coral-50 text-coral-600 border border-coral-200" : "text-ink-500 hover:text-ink-900 border border-transparent"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-1 gap-4 max-w-sm">
        <Card className="p-4">
          <div className="label mb-1">Último consumo</div>
          <div className="text-xl font-bold text-ink-900">
            {filtrados.at(-1)?.consumo ?? "—"} {filtrados.at(-1)?.unidad ?? ""}
          </div>
          <div className="text-xs text-ink-400 mt-1">{filtrados.at(-1)?.periodo ?? ""}</div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Visualización de tendencia — {tipoActivo}</CardTitle></CardHeader>
        <div className="flex items-end gap-3 h-40 px-2">
          {filtrados.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((s, i) => {
            const max = Math.max(...filtrados.map(x => x.importe), 1);
            const h = (s.importe / max) * 100;
            return (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-ink-600 font-medium">{eur(s.importe)}</div>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-coral-500/40 to-coral-400/20 transition-all duration-300"
                  style={{ height: `${Math.max(h, 5)}%`, minHeight: "8px" }} />
                <div className="text-[9px] text-ink-400 text-center">{s.periodo}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico {tipoActivo}</CardTitle></CardHeader>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200/60">
                <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Periodo</th>
                <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Proveedor</th>
                <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Consumo</th>
                <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Importe</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(s => (
                <tr key={s.id} className="border-b border-gray-200/60 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 text-ink-900">{s.periodo}</td>
                  <td className="py-3 px-3 text-ink-600">{s.proveedor}</td>
                  <td className="py-3 px-3 text-right text-ink-500">{s.consumo} {s.unidad}</td>
                  <td className="py-3 px-3 text-right font-medium text-ink-900">{eur(s.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Nueva factura de ${tipoActivo}`}>
        <div className="space-y-4">
          <input className="input" placeholder="Proveedor *" value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))} />
          <input className="input" placeholder="Periodo (ej: Jun 2026) *" value={form.periodo} onChange={e => setForm(p => ({ ...p, periodo: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder={`Consumo (${tipoActivo === "electricidad" ? "kWh" : tipoActivo === "agua" ? "m³" : "---"})`} type="number" step="0.01" value={form.consumo} onChange={e => setForm(p => ({ ...p, consumo: e.target.value }))} />
            <input className="input" placeholder="Importe *" type="number" step="0.01" value={form.importe} onChange={e => setForm(p => ({ ...p, importe: e.target.value }))} />
          </div>
          <input className="input" placeholder="Fecha" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit}>Guardar factura</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
