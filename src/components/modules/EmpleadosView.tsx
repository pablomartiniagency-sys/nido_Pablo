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
  const { empleados, incidencias, addEmpleado, updateEmpleado, removeEmpleado } = useStore();
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
        <Card className="p-4"><div className="label mb-1">Plantilla activa</div><div className="text-xl font-bold text-white">{activos.length}</div></Card>
        <Card className="p-4"><div className="label mb-1">Coste bruto mensual</div><div className="text-xl font-bold text-white">{eur(costeTotal)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Coste SS empresa</div><div className="text-xl font-bold text-white">{eur(costeTotal * 0.296)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Incidencias abiertas</div><div className="text-xl font-bold text-amber-400">{incidencias.filter(i => !i.resuelta).length}</div></Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleados.filter(e => e.activo).map(e => (
          <Card key={e.id} hover className="cursor-pointer" onClick={() => openEdit(e)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{e.nombre}</h3>
                <p className="text-xs text-white/40">{e.puesto}</p>
              </div>
              <Badge variant={e.tipoContrato === "indefinido" ? "success" : e.tipoContrato === "practicas" ? "info" : "warning"}>{e.tipoContrato}</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-white/50">
              <div className="flex justify-between"><span>Bruto mensual</span><span className="text-white font-medium">{eur(e.salarioBrutoMensual)}</span></div>
              <div className="flex justify-between"><span>Horas/semana</span><span className="text-white font-medium">{e.horasSemanales}h</span></div>
              <div className="flex justify-between"><span>DNI</span><span className="text-white/40 font-mono text-[10px]">{e.dni}</span></div>
              <div className="flex justify-between"><span>Desde</span><span className="text-white font-medium">{e.fechaAlta}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Incidencias activas</CardTitle></CardHeader>
        <div className="space-y-3">
          {incidencias.filter(i => !i.resuelta).length === 0 ? (
            <p className="text-sm text-white/40">No hay incidencias activas</p>
          ) : (
            incidencias.filter(i => !i.resuelta).map(i => (
              <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i.gravedad === "grave" ? "bg-red-400" : i.gravedad === "moderada" ? "bg-amber-400" : "bg-blue-400"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{i.alumno}</span>
                    <Badge variant={i.gravedad === "grave" ? "danger" : i.gravedad === "moderada" ? "warning" : "info"}>{i.gravedad}</Badge>
                    <span className="text-[10px] text-white/30">{i.fecha}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{i.descripcion}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar empleado" : "Nuevo empleado"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input col-span-2" placeholder="Nombre completo *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            <input className="input" placeholder="DNI/NIF *" value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} />
            <input className="input" placeholder="Puesto *" value={form.puesto} onChange={e => setForm(p => ({ ...p, puesto: e.target.value }))} />
            <input className="input" placeholder="Salario bruto mensual *" type="number" step="0.01" value={form.salarioBrutoMensual} onChange={e => setForm(p => ({ ...p, salarioBrutoMensual: e.target.value }))} />
            <input className="input" placeholder="Horas/semana" type="number" step="0.5" value={form.horasSemanales} onChange={e => setForm(p => ({ ...p, horasSemanales: e.target.value }))} />
            <select className="select" value={form.tipoContrato} onChange={e => setForm(p => ({ ...p, tipoContrato: e.target.value as Empleado["tipoContrato"] }))}>
              <option value="indefinido">Indefinido</option><option value="temporal">Temporal</option><option value="practicas">Prácticas</option><option value="fijo_discontinuo">Fijo discontinuo</option>
            </select>
            <input className="input" placeholder="Fecha alta" type="date" value={form.fechaAlta} onChange={e => setForm(p => ({ ...p, fechaAlta: e.target.value }))} />
            <input className="input" placeholder="IBAN" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
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
