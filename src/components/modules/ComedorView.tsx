"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus } from "@/components/ui/Icons";
import Link from "next/link";
import type { Incidencia, MenuSemanal } from "@/types";
import type { AlumnoPerfil } from "@/types/crm";

const DIAS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
] as const;

export function ComedorView() {
  const { menu, incidencias, alumnos, updateMenu, addIncidencia, updateIncidencia } = useStore();
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
        {DIAS.map((d, idx) => {
          const m = menu[d.key];
          const colores = ["bg-orange-50 text-orange-700 border-orange-200", "bg-blue-50 text-blue-700 border-blue-200", "bg-emerald-50 text-emerald-700 border-emerald-200", "bg-rose-50 text-rose-700 border-rose-200", "bg-purple-50 text-purple-700 border-purple-200"];
          return (
            <Card key={d.key} hover className="p-4 cursor-pointer" onClick={() => openEditDay(d.key)}>
              <div className={`chip text-xs mb-3 ${colores[idx % colores.length]}`}>{d.label}</div>
              <div className="space-y-3">
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-ink-300">Primero</div><div className="text-sm text-ink-700 mt-0.5">{m.primero}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-ink-300">Segundo</div><div className="text-sm text-ink-700 mt-0.5">{m.segundo}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-ink-300">Postre</div><div className="text-sm text-ink-700 mt-0.5">{m.postre}</div></div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-ink-400 text-center">Click para editar</div>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Alérgenos y alertas activas</CardTitle></CardHeader>
          {(() => {
            const alergiasCRM = alumnos.flatMap(a => a.alergias.map(al => ({ alumnoId: a.id, alumnoNombre: a.nombre, tipo: al.tipo, gravedad: al.gravedad, desencadenante: al.desencadenante, notas: al.observaciones })));
            const alertasIncidencias = alergenos;
            if (alergiasCRM.length === 0 && alertasIncidencias.length === 0) {
              return <p className="text-sm text-ink-400">No hay alertas de alérgenos activas</p>;
            }
            return (
            <div className="space-y-3">
              {alergiasCRM.map((al, i) => (
                <div key={`crm-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Link href="/alumnos" className="text-sm font-medium text-amber-700 hover:underline">{al.alumnoNombre}</Link>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${al.gravedad === "grave" ? "bg-red-100 text-red-600" : al.gravedad === "moderada" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>{al.tipo}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">{al.notas || `Alergia a "${al.desencadenante}" registrada en ficha médica`}</div>
                  </div>
                </div>
              ))}
              {alertasIncidencias.map(a => {
                const perfil = alumnos.find(p => p.nombre === a.alumno);
                return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      {perfil ? (
                        <Link href="/alumnos" className="text-sm font-medium text-red-700 hover:underline">{a.alumno}</Link>
                      ) : (
                        <div className="text-sm font-medium text-red-700">{a.alumno} <span className="text-[9px] text-ink-400 font-normal">(sin perfil)</span></div>
                      )}
                      <Badge variant="danger">{a.gravedad}</Badge>
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">{a.descripcion}</div>
                    {perfil?.curso && <div className="text-[10px] text-ink-400 mt-0.5">Curso: {perfil.curso}</div>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateIncidencia(a.id, { resuelta: true })}
                        className="text-xs text-emerald-600 hover:text-emerald-500">Marcar resuelta</button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            );
          })()}
        </Card>

        <Card>
          <CardHeader><CardTitle>Últimas incidencias</CardTitle></CardHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {incidencias.slice(-8).reverse().map(i => {
              const perfil = alumnos.find(p => p.nombre === i.alumno);
              return (
              <div key={i.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs border ${i.resuelta ? "bg-gray-50 border-gray-100" : i.gravedad === "grave" ? "bg-red-50 border-red-100" : i.gravedad === "moderada" ? "bg-amber-50 border-amber-100" : "bg-white border-gray-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i.gravedad === "grave" ? "bg-red-500" : i.gravedad === "moderada" ? "bg-amber-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {perfil ? (
                      <Link href="/alumnos" className="text-ink-900 font-medium hover:underline truncate">{i.alumno}</Link>
                    ) : (
                      <span className="text-ink-900 font-medium truncate">{i.alumno}</span>
                    )}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium uppercase ${
                      i.tipo === "alergia" ? "bg-red-50 text-red-600" :
                      i.tipo === "caida" ? "bg-orange-50 text-orange-600" :
                      i.tipo === "fiebre" ? "bg-rose-50 text-rose-600" :
                      i.tipo === "conflicto" ? "bg-purple-50 text-purple-600" :
                      "bg-gray-50 text-ink-500"
                    }`}>{i.tipo}</span>
                    {i.resuelta && <span className="text-[8px] text-emerald-500 font-medium">Resuelta</span>}
                  </div>
                  <div className="text-ink-400 mt-0.5 truncate">{i.descripcion}</div>
                  {perfil?.curso && <div className="text-[9px] text-ink-300 mt-0.5">{perfil.curso}</div>}
                </div>
                <span className="text-ink-300 text-[9px] shrink-0 mt-0.5">{i.fecha}</span>
              </div>
              );
            })}
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
