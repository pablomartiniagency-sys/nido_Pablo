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
import { IconPlus, IconTrash } from "@/components/ui/Icons";
import type { Empleado } from "@/types";

export function EmpleadosView() {
  const { empleados, addEmpleado, updateEmpleado, removeEmpleado } = useStore();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", dni: "", puesto: "", tipoContrato: "indefinido" as Empleado["tipoContrato"], horasSemanales: "37.5", salarioBrutoMensual: "", fechaAlta: "", iban: "", activo: true });

  const activos = useMemo(() => empleados.filter(e => e.activo), [empleados]);
  const costeTotal = useMemo(() => activos.reduce((s, e) => s + e.salarioBrutoMensual, 0), [activos]);

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: "", dni: "", puesto: "", tipoContrato: "indefinido", horasSemanales: "37.5", salarioBrutoMensual: "", fechaAlta: new Date().toISOString().split("T")[0], iban: "", activo: true });
    setShowModal(true);
  };

  const openEdit = (e: Empleado) => {
    setEditId(e.id);
    setForm({ nombre: e.nombre, dni: e.dni, puesto: e.puesto, tipoContrato: e.tipoContrato, horasSemanales: String(e.horasSemanales), salarioBrutoMensual: String(e.salarioBrutoMensual), fechaAlta: e.fechaAlta, iban: e.iban, activo: e.activo });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.dni || !form.puesto || !form.salarioBrutoMensual) { toast("Completa los campos obligatorios", "error"); return; }
    const salario = parseFloat(form.salarioBrutoMensual);
    if (isNaN(salario) || salario <= 0) { toast("Salario inválido", "error"); return; }
    const horas = parseFloat(form.horasSemanales) || 0;
    if (editId) {
      updateEmpleado(editId, { nombre: form.nombre, dni: form.dni, puesto: form.puesto, tipoContrato: form.tipoContrato, horasSemanales: horas, salarioBrutoMensual: salario, fechaAlta: form.fechaAlta, iban: form.iban, activo: form.activo });
      toast("Empleado actualizado");
    } else {
      const newE: Empleado = { id: genId("emp"), nombre: form.nombre, dni: form.dni, puesto: form.puesto, tipoContrato: form.tipoContrato, horasSemanales: horas, salarioBrutoMensual: salario, fechaAlta: form.fechaAlta, iban: form.iban, activo: form.activo };
      addEmpleado(newE);
      toast("Empleado añadido");
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Empleados" description={`${activos.length} empleados activos · Coste ${eur(costeTotal)}/mes`}
        actions={<Button size="sm" onClick={openNew}><IconPlus width={14} height={14} /> Nuevo empleado</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="label mb-1">Plantilla activa</div><div className="text-xl font-bold text-ink-900">{activos.length}</div></Card>
        <Card className="p-4"><div className="label mb-1">Coste bruto mensual</div><div className="text-xl font-bold text-ink-900">{eur(costeTotal)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Coste SS empresa</div><div className="text-xl font-bold text-ink-900">{eur(costeTotal * 0.296)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Total empleados</div><div className="text-xl font-bold text-ink-900">{empleados.length}</div></Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleados.filter(e => e.activo).map(e => (
          <Card key={e.id} hover className="cursor-pointer" onClick={() => openEdit(e)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">{e.nombre}</h3>
                <p className="text-xs text-ink-500">{e.puesto}</p>
              </div>
              <Badge variant={e.tipoContrato === "indefinido" ? "success" : e.tipoContrato === "practicas" ? "info" : "warning"}>{e.tipoContrato}</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-ink-500">
              <div className="flex justify-between"><span>Bruto mensual</span><span className="text-ink-900 font-medium">{eur(e.salarioBrutoMensual)}</span></div>
              <div className="flex justify-between"><span>Horas/semana</span><span className="text-ink-900 font-medium">{e.horasSemanales}h</span></div>
              <div className="flex justify-between"><span>DNI</span><span className="text-ink-400 font-mono text-[10px]">{e.dni}</span></div>
              <div className="flex justify-between"><span>Desde</span><span className="text-ink-900 font-medium">{e.fechaAlta}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar empleado" : "Nuevo empleado"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">Nombre completo <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: María García López" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">DNI/NIF <span className="text-coral-400">*</span></label>
              <input className="input w-full" placeholder="12345678Z" value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Puesto <span className="text-coral-400">*</span></label>
              <input className="input w-full" placeholder="Ej: Educadora, Cocinera..." value={form.puesto} onChange={e => setForm(p => ({ ...p, puesto: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Salario bruto mensual (€) <span className="text-coral-400">*</span></label>
              <input className="input w-full" placeholder="1500" type="number" step="0.01" value={form.salarioBrutoMensual} onChange={e => setForm(p => ({ ...p, salarioBrutoMensual: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Horas semanales</label>
              <input className="input w-full" placeholder="37.5" type="number" step="0.5" value={form.horasSemanales} onChange={e => setForm(p => ({ ...p, horasSemanales: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Tipo de contrato</label>
              <select className="select w-full" value={form.tipoContrato} onChange={e => setForm(p => ({ ...p, tipoContrato: e.target.value as Empleado["tipoContrato"] }))}>
                <option value="indefinido">Indefinido</option><option value="temporal">Temporal</option><option value="practicas">Prácticas</option><option value="fijo_discontinuo">Fijo discontinuo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Fecha de alta</label>
              <input className="input w-full" type="date" value={form.fechaAlta} onChange={e => setForm(p => ({ ...p, fechaAlta: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">IBAN (para nómina SEPA)</label>
            <input className="input w-full" placeholder="ES00 0000 0000 0000 0000 0000" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
            Empleado activo
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit}>{editId ? "Guardar cambios" : "Añadir empleado"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
