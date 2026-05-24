"use client";

import { useState, useMemo } from "react";
import { useStore, genId } from "@/lib/data/useStore";
import { eur } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus, IconSearch, IconTrash, IconFile } from "@/components/ui/Icons";
import Link from "next/link";
import { SERVICIOS_CATALOGO } from "@/lib/data/catalogos";
import type { Familia, Servicio } from "@/types";

const SERVICIO_OTRO = { concepto: "__otro__", importe: 0, descripcion: "Otro concepto personalizado" };

export function FamiliasView() {
  const { familias, facturas, addFamilia, updateFamilia, removeFamilia } = useStore();
  const { toast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", iban: "", alumnosStr: "", servicios: [] as Servicio[] });

  const filtradas = useMemo(() => {
    if (!busqueda) return familias;
    const q = busqueda.toLowerCase();
    return familias.filter(f => f.nombre.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.alumnos.some(a => a.toLowerCase().includes(q)));
  }, [familias, busqueda]);

  const getBillingStatus = (familiaId: string) => {
    const facturasFamilia = facturas.filter(f => f.familiaId === familiaId);
    const pagado = facturasFamilia.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
    const pendiente = facturasFamilia.filter(f => f.estado === "enviada").reduce((s, f) => s + f.total, 0);
    const impagado = facturasFamilia.filter(f => f.estado === "impago").reduce((s, f) => s + f.total, 0);
    const totalFacturado = facturasFamilia.reduce((s, f) => s + f.total, 0);
    return { pagado, pendiente, impagado, totalFacturado, deudaTotal: pendiente + impagado };
  };

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: "", email: "", telefono: "", iban: "", alumnosStr: "", servicios: [] });
    setShowModal(true);
  };

  const openEdit = (f: Familia) => {
    setEditId(f.id);
    setForm({ nombre: f.nombre, email: f.email, telefono: f.telefono, iban: f.iban, alumnosStr: f.alumnos.join(", "), servicios: [...f.servicios] });
    setShowModal(true);
  };

  const addServicioItem = () => setForm(p => ({ ...p, servicios: [...p.servicios, { concepto: "", importe: 0 }] }));
  const removeServicioItem = (i: number) => setForm(p => ({ ...p, servicios: p.servicios.filter((_, idx) => idx !== i) }));

  const setServicioConcepto = (i: number, valor: string) => {
    setForm(p => {
      const s2 = [...p.servicios];
      if (valor === "__otro__") {
        s2[i] = { concepto: "", importe: 0 };
      } else {
        const cat = [...SERVICIOS_CATALOGO, SERVICIO_OTRO].find(c => c.concepto === valor);
        s2[i] = { concepto: cat?.concepto || valor, importe: cat?.importe || 0 };
      }
      return { ...p, servicios: s2 };
    });
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.email) { toast("Nombre y email requeridos", "error"); return; }
    const alumnos = form.alumnosStr.split(",").map(a => a.trim()).filter(Boolean);
    const servicios = form.servicios.filter(s => s.concepto && s.importe > 0);
    if (editId) {
      updateFamilia(editId, { nombre: form.nombre, email: form.email, telefono: form.telefono, iban: form.iban, alumnos, servicios });
      toast("Familia actualizada");
    } else {
      const newF: Familia = { id: genId("fam"), nombre: form.nombre, email: form.email, telefono: form.telefono, iban: form.iban, alumnos, servicios };
      addFamilia(newF);
      toast("Familia añadida");
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Familias — CRM" description={`${familias.length} familias · ${familias.reduce((s, f) => s + f.alumnos.length, 0)} alumnos`}
        actions={<Button size="sm" onClick={openNew}><IconPlus width={14} height={14} /> Nueva familia</Button>}
      />

      <div className="relative max-w-md">
        <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Buscar familia o alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtradas.map(f => (
          <Card key={f.id} hover className="cursor-pointer" onClick={() => openEdit(f)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">{f.nombre}</h3>
                <p className="text-xs text-ink-500">{f.email} · {f.telefono}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {(() => { const bs = getBillingStatus(f.id); return (
                  <>
                    <Badge variant="success">Cobrado: {eur(bs.pagado)}</Badge>
                    {bs.pendiente > 0 && <Badge variant="info">{eur(bs.pendiente)} pendiente</Badge>}
                    {bs.impagado > 0 && <Badge variant="danger">{eur(bs.impagado)} impagado</Badge>}
                  </>
                ); })()}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {f.alumnos.map((a, i) => (
                <span key={i} className="chip bg-gray-50 border-gray-200 text-ink-600 text-[10px]">{a}</span>
              ))}
            </div>
            <div className="text-xs text-ink-400 truncate font-mono">IBAN: {f.iban}</div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Servicios contratados</div>
              {f.servicios.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-ink-600">{s.concepto}</span>
                  <span className="text-ink-900 font-medium">{eur(s.importe)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <div className="flex gap-2">
                <Link href="/facturacion" className="text-xs text-coral-500 hover:text-coral-600 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <IconFile width={12} height={12} /> Ver facturación
                </Link>
                <button onClick={(e) => { e.stopPropagation(); removeFamilia(f.id); toast(`Familia ${f.nombre} eliminada`, "info"); }} className="text-xs text-ink-400 hover:text-red-400 flex items-center gap-1">
                  <IconTrash width={12} height={12} />
                </button>
              </div>
              <span className="text-xs text-ink-400">Click para editar</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar familia" : "Nueva familia"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Nombre de la familia <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: García López" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Email <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="maria@ejemplo.com" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Teléfono</label>
              <input className="input w-full" placeholder="600 00 00 00" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">IBAN (para domiciliación)</label>
              <input className="input w-full" placeholder="ES00 0000 0000 0000 0000 0000" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Alumnos</label>
            <p className="text-xs text-ink-400">Separa los nombres por comas. Ej: "Martina (3a), Leo (1a)"</p>
            <input className="input w-full" placeholder="Martina (3a), Leo (1a)" value={form.alumnosStr} onChange={e => setForm(p => ({ ...p, alumnosStr: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">Servicios contratados</div>
              <button onClick={addServicioItem} className="text-xs text-coral-500 hover:text-coral-600">+ Añadir servicio</button>
            </div>
            <p className="text-xs text-ink-400">Selecciona los servicios que la familia tiene contratados. Estos servicios se usarán para generar las facturas automáticas.</p>
            {form.servicios.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <select className="select w-full" value={s.concepto || "__otro__"} onChange={e => setServicioConcepto(i, e.target.value)}>
                    <option value="" disabled>Selecciona un servicio...</option>
                    {SERVICIOS_CATALOGO.map(c => <option key={c.concepto} value={c.concepto}>{c.concepto} — {eur(c.importe)}</option>)}
                    <option value="__otro__">✏️ Otro concepto personalizado...</option>
                  </select>
                  {(!s.concepto || s.concepto === "__otro__") && (
                    <input className="input w-full" placeholder="Escribe el nombre del servicio" value={s.concepto === "__otro__" ? "" : s.concepto} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], concepto: e.target.value }; return { ...p, servicios: s2 }; })} />
                  )}
                </div>
                <div className="w-28 space-y-1">
                  <input className="input w-full" placeholder="Importe €" type="number" step="0.01" value={s.importe || ""} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], importe: parseFloat(e.target.value) || 0 }; return { ...p, servicios: s2 }; })} />
                </div>
                <button onClick={() => removeServicioItem(i)} className="mt-1 text-ink-400 hover:text-red-400"><IconTrash width={14} height={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit}>{editId ? "Guardar cambios" : "Añadir familia"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
