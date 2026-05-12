"use client";

import { useState } from "react";
import { useStore } from "@/lib/data/useStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus } from "@/components/ui/Icons";
import type { Incidencia, MenuSemanal } from "@/types";

const DIAS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
] as const;

export function ComedorView() {
  const { menu, incidencias, updateMenu, addIncidencia, updateIncidencia } = useStore();
  const { toast } = useToast();
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({ primero: "", segundo: "", postre: "" });
  const [showIncidencia, setShowIncidencia] = useState(false);
  const [incForm, setIncForm] = useState({ alumno: "", tipo: "otro" as Incidencia["tipo"], descripcion: "", gravedad: "leve" as Incidencia["gravedad"] });

  const alergenos = incidencias.filter(i => i.tipo === "alergia" && !i.resuelta);

  const openEditDay = (dia: string) => {
    const m = menu[dia as keyof MenuSemanal];
    setMenuForm({ primero: m.primero, segundo: m.segundo, postre: m.postre });
    setEditingDay(dia);
  };

  const saveMenu = () => {
    if (!editingDay || !menuForm.primero || !menuForm.segundo || !menuForm.postre) {
      toast("Completa todos los platos", "error"); return;
    }
    const newMenu = { ...menu, [editingDay]: menuForm };
    updateMenu(newMenu);
    toast(`Menú del ${editingDay} actualizado`);
    setEditingDay(null);
  };

  const addIncidenciaItem = () => {
    if (!incForm.alumno || !incForm.descripcion) { toast("Completa los campos", "error"); return; }
    const newInc: Incidencia = {
      id: `inc-${Date.now()}`,
      alumno: incForm.alumno,
      tipo: incForm.tipo,
      descripcion: incForm.descripcion,
      gravedad: incForm.gravedad,
      notificada: false,
      resuelta: false,
      fecha: new Date().toISOString().split("T")[0],
    };
    addIncidencia(newInc);
    toast("Incidencia registrada");
    setShowIncidencia(false);
    setIncForm({ alumno: "", tipo: "otro", descripcion: "", gravedad: "leve" });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Comedor" description="Menú semanal editable y control de incidencias"
        actions={
          <Button size="sm" onClick={() => setShowIncidencia(true)}><IconPlus width={14} height={14} /> Nueva incidencia</Button>
        }
      />

      <div className="grid md:grid-cols-5 gap-3">
        {DIAS.map(d => {
          const m = menu[d.key];
          return (
            <Card key={d.key} hover className="p-4 cursor-pointer" onClick={() => openEditDay(d.key)}>
              <div className="label mb-3">{d.label}</div>
              <div className="space-y-3">
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Primero</div><div className="text-sm text-white/80 mt-0.5">{m.primero}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Segundo</div><div className="text-sm text-white/80 mt-0.5">{m.segundo}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-white/30">Postre</div><div className="text-sm text-white/80 mt-0.5">{m.postre}</div></div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/[0.04] text-[10px] text-white/30 text-center">Click para editar</div>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Alérgenos y alertas activas</CardTitle></CardHeader>
          {alergenos.length === 0 ? (
            <p className="text-sm text-white/40">No hay alertas de alérgenos activas</p>
          ) : (
            <div className="space-y-3">
              {alergenos.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-amber-300">{a.alumno}</div>
                      <Badge variant="warning">{a.gravedad}</Badge>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">{a.descripcion}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateIncidencia(a.id, { resuelta: true })}
                        className="text-xs text-emerald-400 hover:text-emerald-300">Marcar resuelta</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimas incidencias</CardTitle></CardHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {incidencias.slice(-5).reverse().map(i => (
              <div key={i.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] text-xs">
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i.gravedad === "grave" ? "bg-red-400" : i.gravedad === "moderada" ? "bg-amber-400" : "bg-blue-400"}`} />
                <div className="flex-1">
                  <span className="text-white font-medium">{i.alumno}</span>
                  <span className="text-white/40"> — {i.descripcion.slice(0, 60)}</span>
                </div>
                <span className="text-white/20 text-[9px] shrink-0">{i.fecha}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={!!editingDay} onClose={() => setEditingDay(null)} title={`Editar menú — ${editingDay}`}>
        <div className="space-y-4">
          <div><div className="label mb-1">Primer plato</div>
            <input className="input" value={menuForm.primero} onChange={e => setMenuForm(p => ({ ...p, primero: e.target.value }))} /></div>
          <div><div className="label mb-1">Segundo plato</div>
            <input className="input" value={menuForm.segundo} onChange={e => setMenuForm(p => ({ ...p, segundo: e.target.value }))} /></div>
          <div><div className="label mb-1">Postre</div>
            <input className="input" value={menuForm.postre} onChange={e => setMenuForm(p => ({ ...p, postre: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setEditingDay(null)}>Cancelar</Button>
            <Button size="sm" onClick={saveMenu}>Guardar menú</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showIncidencia} onClose={() => setShowIncidencia(false)} title="Registrar incidencia">
        <div className="space-y-4">
          <input className="input" placeholder="Nombre del alumno *" value={incForm.alumno} onChange={e => setIncForm(p => ({ ...p, alumno: e.target.value }))} />
          <select className="select" value={incForm.tipo} onChange={e => setIncForm(p => ({ ...p, tipo: e.target.value as Incidencia["tipo"] }))}>
            <option value="caida">Caída</option><option value="fiebre">Fiebre</option><option value="alergia">Alergia</option>
            <option value="conflicto">Conflicto</option><option value="otro">Otro</option>
          </select>
          <textarea className="textarea h-20" placeholder="Descripción *" value={incForm.descripcion} onChange={e => setIncForm(p => ({ ...p, descripcion: e.target.value }))} />
          <select className="select" value={incForm.gravedad} onChange={e => setIncForm(p => ({ ...p, gravedad: e.target.value as Incidencia["gravedad"] }))}>
            <option value="leve">Leve</option><option value="moderada">Moderada</option><option value="grave">Grave</option>
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowIncidencia(false)}>Cancelar</Button>
            <Button size="sm" onClick={addIncidenciaItem}>Registrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
