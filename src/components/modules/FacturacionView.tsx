"use client";

import { useState, useMemo } from "react";
import { useStore, genId, nextFacturaNum } from "@/lib/data/useStore";
import { eur } from "@/lib/format";
import { ESCUELA_DEMO } from "@/lib/data/catalogos";
import { generarSEPA } from "@/lib/sepa";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconSearch, IconDownload, IconCheck, IconPlus, IconTrash } from "@/components/ui/Icons";
import type { EstadoFactura, Factura, Servicio } from "@/types";

const ESTADO_MAP: Record<EstadoFactura, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  pagada: { label: "Pagada", variant: "success" },
  enviada: { label: "Enviada", variant: "info" },
  impago: { label: "Impago", variant: "danger" },
  borrador: { label: "Borrador", variant: "default" },
  anulada: { label: "Anulada", variant: "default" },
};

export function FacturacionView() {
  const { facturas, familias, addFactura, updateFactura, removeFactura } = useStore();
  const { toast } = useToast();
  const [filtroEstado, setFiltroEstado] = useState<EstadoFactura | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [sepaXml, setSepaXml] = useState("");
  const [showSepa, setShowSepa] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ familiaId: "", periodo: `Junio 2026`, items: [{ concepto: "", importe: "" }] });

  const filtradas = useMemo(() => {
    return facturas.filter(f => {
      if (filtroEstado !== "todas" && f.estado !== filtroEstado) return false;
      if (busqueda) { const q = busqueda.toLowerCase(); return f.familia.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q); }
      return true;
    }).sort((a, b) => b.numero.localeCompare(a.numero));
  }, [facturas, filtroEstado, busqueda]);

  const totales = useMemo(() => {
    const cobrado = facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
    const pendiente = facturas.filter(f => f.estado !== "pagada" && f.estado !== "anulada").reduce((s, f) => s + f.total, 0);
    const impago = facturas.filter(f => f.estado === "impago").reduce((s, f) => s + f.total, 0);
    return { cobrado, pendiente, impago };
  }, [facturas]);

  const handleGenerarSEPA = () => {
    const result = generarSEPA(facturas, familias, ESCUELA_DEMO);
    if (result.count === 0) { toast("No hay facturas pendientes", "info"); return; }
    setSepaXml(result.xml);
    setShowSepa(true);
  };

  const handleDescargarXML = () => {
    const blob = new Blob([sepaXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `remesa-sepa-${Date.now()}.xml`; a.click();
    URL.revokeObjectURL(url);
    toast("Fichero SEPA descargado. Súbelo a tu banco.");
  };

  const handleSubmitFactura = () => {
    if (!form.familiaId || !form.periodo || form.items.some(i => !i.concepto || !i.importe)) {
      toast("Completa todos los campos", "error"); return;
    }
    const familia = familias.find(f => f.id === form.familiaId);
    if (!familia) { toast("Selecciona una familia", "error"); return; }
    const items: Servicio[] = form.items.map(i => ({ concepto: i.concepto, importe: parseFloat(i.importe) }));
    const total = items.reduce((s, i) => s + i.importe, 0);
    const newFactura: Factura = {
      id: genId("fac"),
      numero: nextFacturaNum(),
      familiaId: form.familiaId,
      familia: familia.nombre,
      periodo: form.periodo,
      items,
      total,
      estado: "enviada",
      diasImpago: 0,
    };
    addFactura(newFactura);
    toast(`Factura ${newFactura.numero} creada para ${familia.nombre}`);
    setShowModal(false);
    setForm({ familiaId: "", periodo: "Junio 2026", items: [{ concepto: "", importe: "" }] });
  };

  const addItemForm = () => setForm(p => ({ ...p, items: [...p.items, { concepto: "", importe: "" }] }));
  const removeItemForm = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItemForm = (i: number, field: keyof Servicio, value: string) => setForm(p => ({
    ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item),
  }));

  const handleMarcarPagada = (id: string) => { updateFactura(id, { estado: "pagada" } as Partial<Factura>); toast("Factura marcada como pagada"); };
  const handleMarcarImpago = (id: string) => { updateFactura(id, { estado: "impago", diasImpago: 1 } as Partial<Factura>); toast("Factura marcada como impago", "error"); };
  const handleDelete = (id: string) => { removeFactura(id); toast("Factura eliminada", "info"); };

  const estados: Array<{ value: EstadoFactura | "todas"; label: string }> = [
    { value: "todas", label: "Todas" }, { value: "pagada", label: "Pagadas" }, { value: "enviada", label: "Enviadas" },
    { value: "impago", label: "Impago" }, { value: "borrador", label: "Borrador" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Facturación" description="Gestión de cobros y remesas SEPA"
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}><IconPlus width={14} height={14} /> Nueva factura</Button>
            <Button variant="secondary" size="sm" onClick={handleGenerarSEPA}>
              <IconDownload width={14} height={14} /> Generar remesa SEPA
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="label mb-1">Cobrado</div><div className="text-xl font-bold text-emerald-400">{eur(totales.cobrado)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Pendiente</div><div className="text-xl font-bold text-amber-400">{eur(totales.pendiente)}</div></Card>
        <Card className="p-4"><div className="label mb-1">En impago</div><div className="text-xl font-bold text-red-400">{eur(totales.impago)}</div></Card>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-9" placeholder="Buscar factura o familia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {estados.map(e => (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filtroEstado === e.value ? "bg-coral-500/20 text-coral-300 border border-coral-500/30" : "text-white/50 hover:text-white border border-transparent"}`}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Facturas ({filtradas.length})</CardTitle></CardHeader>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Factura</th>
                <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Familia</th>
                <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Periodo</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Total</th>
                <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase">Estado</th>
                <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(f => (
                <tr key={f.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 text-white font-medium">{f.numero}</td>
                  <td className="py-3 px-3 text-white/70">{f.familia}</td>
                  <td className="py-3 px-3 text-white/50">{f.periodo}</td>
                  <td className="py-3 px-3 text-right font-medium text-white">{eur(f.total)}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={ESTADO_MAP[f.estado].variant}>{ESTADO_MAP[f.estado].label}</Badge>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1">
                      {f.estado === "impago" && (
                        <button onClick={() => handleMarcarPagada(f.id)} className="text-xs text-emerald-400 hover:text-emerald-300 p-1" title="Cobrar"><IconCheck width={14} height={14} /></button>
                      )}
                      {f.estado === "enviada" && (
                        <button onClick={() => handleMarcarImpago(f.id)} className="text-xs text-red-400 hover:text-red-300 p-1" title="Marcar impago">⚠</button>
                      )}
                      <button onClick={() => handleDelete(f.id)} className="text-white/20 hover:text-red-400 p-1" title="Eliminar"><IconTrash width={14} height={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showSepa} onClose={() => setShowSepa(false)} title="Remesa SEPA generada">
        <div className="space-y-4">
          <p className="text-sm text-white/60">Fichero ISO 20022 (pain.008.001.02) listo para descargar e importar en tu banco.</p>
          <div className="bg-white/[0.02] rounded-xl p-4 max-h-48 overflow-auto custom-scrollbar">
            <pre className="text-[10px] text-white/40 whitespace-pre-wrap break-all">{sepaXml.slice(0, 800)}...</pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSepa(false)}>Cerrar</Button>
            <Button size="sm" onClick={handleDescargarXML}><IconDownload width={14} height={14} /> Descargar XML</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva factura">
        <div className="space-y-4">
          <select className="select" value={form.familiaId} onChange={e => setForm(p => ({ ...p, familiaId: e.target.value }))}>
            <option value="">Seleccionar familia...</option>
            {familias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          <select className="select" value={form.periodo} onChange={e => setForm(p => ({ ...p, periodo: e.target.value }))}>
            {["Enero 2026","Febrero 2026","Marzo 2026","Abril 2026","Mayo 2026","Junio 2026","Julio 2026","Agosto 2026"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">Servicios</div>
              <button onClick={addItemForm} className="text-xs text-coral-400 hover:text-coral-300">+ Añadir línea</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Concepto" value={item.concepto} onChange={e => updateItemForm(i, "concepto", e.target.value)} />
                <input className="input w-24" placeholder="Importe" type="number" step="0.01" value={item.importe} onChange={e => updateItemForm(i, "importe", e.target.value)} />
                {form.items.length > 1 && <button onClick={() => removeItemForm(i)} className="text-white/20 hover:text-red-400"><IconTrash width={14} height={14} /></button>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmitFactura}>Crear factura</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
