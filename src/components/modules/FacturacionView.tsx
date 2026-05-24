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

type TabView = "resumen" | "facturas";

export function FacturacionView() {
  const { facturas, familias, addFactura, updateFactura, removeFactura } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabView>("resumen");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFactura | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [sepaXml, setSepaXml] = useState("");
  const [showSepa, setShowSepa] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ familiaId: "", periodo: `Junio 2026`, items: [] as { concepto: string; importe: string }[] });

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

  const resumenFamilias = useMemo(() => {
    return familias.map(f => {
      const facturasFamilia = facturas.filter(fc => fc.familiaId === f.id);
      const totalFacturado = facturasFamilia.reduce((s, fc) => s + fc.total, 0);
      const pagado = facturasFamilia.filter(fc => fc.estado === "pagada").reduce((s, fc) => s + fc.total, 0);
      const pendiente = facturasFamilia.filter(fc => fc.estado === "enviada").reduce((s, fc) => s + fc.total, 0);
      const impagado = facturasFamilia.filter(fc => fc.estado === "impago").reduce((s, fc) => s + fc.total, 0);
      const ultimaFactura = facturasFamilia.sort((a, b) => b.numero.localeCompare(a.numero))[0];
      return { ...f, totalFacturado, pagado, pendiente, impagado, deudaTotal: pendiente + impagado, facturasCount: facturasFamilia.length, ultimaFactura };
    }).sort((a, b) => b.deudaTotal - a.deudaTotal);
  }, [familias, facturas]);

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

  const openNewFactura = (familiaId?: string) => {
    const f = familiaId ? familias.find(x => x.id === familiaId) : null;
    const items = f?.servicios?.length
      ? f.servicios.map(s => ({ concepto: s.concepto, importe: s.importe.toString() }))
      : [{ concepto: "", importe: "" }];
    setForm({ familiaId: familiaId || "", periodo: "Junio 2026", items });
    setShowModal(true);
  };

  const handleFamiliaChange = (familiaId: string) => {
    const f = familias.find(x => x.id === familiaId);
    if (f?.servicios?.length) {
      setForm(p => ({ ...p, familiaId, items: f.servicios.map(s => ({ concepto: s.concepto, importe: s.importe.toString() })) }));
    } else {
      setForm(p => ({ ...p, familiaId, items: [{ concepto: "", importe: "" }] }));
    }
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
  const updateItemForm = (i: number, field: "concepto" | "importe", value: string) => setForm(p => ({
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
      <PageHeader title="Facturación" description="Gestión de cobros, facturas y remesas SEPA"
        actions={
          <div className="flex gap-2">
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
              {([["resumen","Resumen por familia"],["facturas","Facturas"]] as [TabView,string][]).map(([k, v]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === k ? "bg-coral-50 text-coral-500 border border-coral-200" : "text-ink-500 hover:text-ink-900"}`}>{v}</button>
              ))}
            </div>
            <Button size="sm" onClick={() => openNewFactura()}><IconPlus width={14} height={14} /> Nueva factura</Button>
            <Button variant="secondary" size="sm" onClick={handleGenerarSEPA}>
              <IconDownload width={14} height={14} /> Remesa SEPA
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="label mb-1">Cobrado</div><div className="text-xl font-bold text-emerald-600">{eur(totales.cobrado)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Pendiente</div><div className="text-xl font-bold text-amber-600">{eur(totales.pendiente)}</div></Card>
        <Card className="p-4"><div className="label mb-1">En impago</div><div className="text-xl font-bold text-red-600">{eur(totales.impago)}</div></Card>
      </div>

      {tab === "resumen" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen de cobros por familia</CardTitle>
              <div className="relative max-w-xs">
                <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input className="input pl-9 w-full" placeholder="Buscar familia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <p className="px-5 pb-3 text-xs text-ink-400">Situación actual de cada familia: servicios contratados, total facturado, cobrado, pendiente e impagado.</p>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Familia</th>
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Servicios contratados</th>
                  <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Facturado</th>
                  <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Cobrado</th>
                  <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Pendiente</th>
                  <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Impagado</th>
                  <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {resumenFamilias.filter(f => !busqueda || f.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(f => (
                  <tr key={f.id} className="border-b border-white/[0.03] hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="text-ink-900 font-medium">{f.nombre}</div>
                      <div className="text-xs text-ink-500">{f.alumnos.length} alumno{f.alumnos.length !== 1 ? "s" : ""} · {f.facturasCount} factura{f.facturasCount !== 1 ? "s" : ""}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[240px]">
                      {f.servicios.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {f.servicios.map((s, i) => (
                            <span key={i} className="text-xs text-ink-600 truncate">{s.concepto}: <span className="text-ink-800">{eur(s.importe)}</span></span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">Sin servicios contratados</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-ink-900">{eur(f.totalFacturado)}</td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-600">{eur(f.pagado)}</td>
                    <td className="py-3 px-3 text-right font-medium text-amber-600">{eur(f.pendiente)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-medium ${f.impagado > 0 ? "text-red-600" : "text-ink-400"}`}>
                        {f.impagado > 0 ? eur(f.impagado) : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openNewFactura(f.id)} title="Nueva factura">
                          <IconPlus width={12} height={12} />
                        </Button>
                        {f.ultimaFactura && f.ultimaFactura.estado === "enviada" && (
                          <button onClick={() => handleMarcarPagada(f.ultimaFactura.id)} className="text-xs text-emerald-600 hover:text-emerald-600 p-1" title="Cobrar última factura">
                            <IconCheck width={14} height={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resumenFamilias.filter(f => !busqueda || f.nombre.toLowerCase().includes(busqueda.toLowerCase())).length === 0 && (
            <div className="p-8 text-center text-ink-400 text-sm">No hay familias registradas. Crea una familia desde el panel Familias.</div>
          )}
        </Card>
      )}

      {tab === "facturas" && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Buscar factura o familia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {estados.map(e => (
                <button key={e.value} onClick={() => setFiltroEstado(e.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filtroEstado === e.value ? "bg-coral-50 text-coral-500 border border-coral-200" : "text-ink-500 hover:text-ink-900 border border-transparent"}`}>
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
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Factura</th>
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Familia</th>
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Periodo</th>
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Servicios</th>
                    <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Total</th>
                    <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase">Estado</th>
                    <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(f => (
                    <tr key={f.id} className="border-b border-white/[0.03] hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-ink-900 font-medium">{f.numero}</td>
                      <td className="py-3 px-3 text-ink-700">{f.familia}</td>
                      <td className="py-3 px-3 text-ink-500">{f.periodo}</td>
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="flex flex-col gap-0.5">
                          {f.items.map((item, i) => (
                            <span key={i} className="text-xs text-ink-500 truncate">{item.concepto}: {eur(item.importe)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-ink-900">{eur(f.total)}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={ESTADO_MAP[f.estado].variant}>{ESTADO_MAP[f.estado].label}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {f.estado === "impago" && (
                            <button onClick={() => handleMarcarPagada(f.id)} className="text-xs text-emerald-600 hover:text-emerald-600 p-1" title="Cobrar"><IconCheck width={14} height={14} /></button>
                          )}
                          {f.estado === "enviada" && (
                            <button onClick={() => handleMarcarImpago(f.id)} className="text-xs text-red-600 hover:text-red-600 p-1" title="Marcar impago">⚠</button>
                          )}
                          <button onClick={() => handleDelete(f.id)} className="text-ink-400 hover:text-red-600 p-1" title="Eliminar"><IconTrash width={14} height={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal open={showSepa} onClose={() => setShowSepa(false)} title="Remesa SEPA generada">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">Fichero ISO 20022 (pain.008.001.02) listo para descargar e importar en tu banco.</p>
          <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-auto custom-scrollbar">
            <pre className="text-[10px] text-ink-500 whitespace-pre-wrap break-all">{sepaXml.slice(0, 800)}...</pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSepa(false)}>Cerrar</Button>
            <Button size="sm" onClick={handleDescargarXML}><IconDownload width={14} height={14} /> Descargar XML</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva factura">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Familia <span className="text-coral-500">*</span></label>
            <select className="select w-full" value={form.familiaId} onChange={e => handleFamiliaChange(e.target.value)}>
              <option value="">Seleccionar familia...</option>
              {familias.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nombre} — {f.servicios.length > 0 ? `${f.servicios.length} servicio(s)` : "sin servicios"}
                </option>
              ))}
            </select>
            {form.familiaId && (() => { const f = familias.find(x => x.id === form.familiaId); return f?.servicios?.length ? (
              <p className="text-xs text-ink-400 mt-1">Los servicios contratados por esta familia se han cargado automáticamente. Puedes ajustar importes o añadir/eliminar líneas.</p>
            ) : null; })()}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Período de facturación <span className="text-coral-500">*</span></label>
            <select className="select w-full" value={form.periodo} onChange={e => setForm(p => ({ ...p, periodo: e.target.value }))}>
              {["Enero 2026","Febrero 2026","Marzo 2026","Abril 2026","Mayo 2026","Junio 2026","Julio 2026","Agosto 2026"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-ink-700">Servicios incluidos</label>
              <button onClick={addItemForm} className="text-xs text-coral-500 hover:text-coral-500">+ Añadir línea</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-ink-500">Concepto</label>
                  <input className="input w-full" placeholder="Ej: Mensualidad, Comedor, Talleres..." value={item.concepto} onChange={e => updateItemForm(i, "concepto", e.target.value)} />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-ink-500">Importe (€)</label>
                  <input className="input w-full" placeholder="0.00" type="number" step="0.01" value={item.importe} onChange={e => updateItemForm(i, "importe", e.target.value)} />
                </div>
                {form.items.length > 1 && <button onClick={() => removeItemForm(i)} className="pb-1 text-ink-400 hover:text-red-600"><IconTrash width={14} height={14} /></button>}
              </div>
            ))}
            {form.items.length > 0 && (
              <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                <span className="text-sm font-medium text-ink-900">
                  Total: {eur(form.items.reduce((s, item) => s + (parseFloat(item.importe) || 0), 0))}
                </span>
              </div>
            )}
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
