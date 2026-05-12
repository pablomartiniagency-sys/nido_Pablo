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
import { IconPlus, IconSearch, IconTrash } from "@/components/ui/Icons";
import type { Familia, Servicio } from "@/types";

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

  const totalIngresos = (familiaId: string) => facturas.filter(f => f.familiaId === familiaId && f.estado === "pagada").reduce((s, f) => s + f.total, 0);
  const totalDeuda = (familiaId: string) => facturas.filter(f => f.familiaId === familiaId && (f.estado === "impago" || f.estado === "enviada")).reduce((s, f) => s + f.total, 0);

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
        <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input className="input pl-9" placeholder="Buscar familia o alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtradas.map(f => (
          <Card key={f.id} hover className="cursor-pointer" onClick={() => openEdit(f)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-white">{f.nombre}</h3>
                <p className="text-xs text-white/40">{f.email} · {f.telefono}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="success">+{eur(totalIngresos(f.id))}</Badge>
                {totalDeuda(f.id) > 0 && <Badge variant="danger">{eur(totalDeuda(f.id))} deuda</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {f.alumnos.map((a, i) => (
                <span key={i} className="chip bg-white/[0.04] border-white/[0.08] text-white/60 text-[10px]">{a}</span>
              ))}
            </div>
            <div className="text-xs text-white/30 truncate font-mono">IBAN: {f.iban}</div>
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-1">Servicios contratados</div>
              {f.servicios.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-white/60">{s.concepto}</span>
                  <span className="text-white font-medium">{eur(s.importe)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex justify-between">
              <button onClick={(e) => { e.stopPropagation(); removeFamilia(f.id); toast(`Familia ${f.nombre} eliminada`, "info"); }} className="text-xs text-white/20 hover:text-red-400 flex items-center gap-1">
                <IconTrash width={12} height={12} /> Eliminar
              </button>
              <span className="text-xs text-white/30">Click para editar</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar familia" : "Nueva familia"}>
        <div className="space-y-4">
          <input className="input" placeholder="Nombre de la familia *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <input className="input" placeholder="Email *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Teléfono" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            <input className="input" placeholder="IBAN" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
          </div>
          <input className="input" placeholder="Alumnos (separados por coma): Martina (3a), Leo (1a)" value={form.alumnosStr} onChange={e => setForm(p => ({ ...p, alumnosStr: e.target.value }))} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">Servicios</div>
              <button onClick={addServicioItem} className="text-xs text-coral-400 hover:text-coral-300">+ Añadir servicio</button>
            </div>
            {form.servicios.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="input flex-1" placeholder="Concepto" value={s.concepto} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], concepto: e.target.value }; return { ...p, servicios: s2 }; })} />
                <input className="input w-24" placeholder="Importe" type="number" step="0.01" value={s.importe || ""} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], importe: parseFloat(e.target.value) || 0 }; return { ...p, servicios: s2 }; })} />
                <button onClick={() => removeServicioItem(i)} className="text-white/20 hover:text-red-400"><IconTrash width={14} height={14} /></button>
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
