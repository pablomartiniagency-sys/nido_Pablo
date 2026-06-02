"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import type { Lead, EstadoLead, FuenteLead } from "@/types/crm";

const estadosLead: Record<EstadoLead, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-blue-100 text-blue-700" },
  contactado: { label: "Contactado", color: "bg-purple-100 text-purple-700" },
  visita_programada: { label: "Visita programada", color: "bg-amber-100 text-amber-700" },
  visita_realizada: { label: "Visita realizada", color: "bg-cyan-100 text-cyan-700" },
  matriculado: { label: "Matriculado", color: "bg-emerald-100 text-emerald-700" },
  perdido: { label: "Perdido", color: "bg-red-100 text-red-700" },
  no_interesado: { label: "No interesado", color: "bg-gray-100 text-ink-500" },
};

const fuentes: FuenteLead[] = ["web", "recomendacion", "google", "instagram", "facebook", "llamada", "email", "otro"];

function ProbabilidadBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs w-8 text-right">{pct}%</span>
    </div>
  );
}

function EditableProbabilidad({ leadId, pct, onUpdate }: { leadId: string; pct: number; onUpdate: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(pct));
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input className="input w-16 text-xs py-1 text-right" type="number" min="0" max="100" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onUpdate(Math.min(100, Math.max(0, parseInt(val) || 0))); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          autoFocus />
        <span className="text-xs text-ink-400">%</span>
        <button onClick={() => { onUpdate(Math.min(100, Math.max(0, parseInt(val) || 0))); setEditing(false); }} className="text-emerald-500 text-xs font-medium">OK</button>
      </div>
    );
  }
  return (
    <button onClick={() => { setVal(String(pct)); setEditing(true); }} className="w-full text-left">
      <ProbabilidadBar pct={pct} />
    </button>
  );
}

export default function OportunidadesView() {
  const { leads, oportunidades, addLead, updateLead, removeLead, addOportunidad, updateOportunidad, removeOportunidad } = useStore();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOportunidadForm, setShowOportunidadForm] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filtroEstado !== "todos" && l.estado !== filtroEstado) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.nombreHijo || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [leads, search, filtroEstado]);

  const pipelineStats = useMemo(() => {
    const total = leads.length;
    const nuevos = leads.filter(l => l.estado === "nuevo").length;
    const visitas = leads.filter(l => l.estado === "visita_programada" || l.estado === "visita_realizada").length;
    const matriculados = leads.filter(l => l.estado === "matriculado").length;
    const perdidos = leads.filter(l => l.estado === "perdido" || l.estado === "no_interesado").length;
    const conversion = total > 0 ? Math.round((matriculados / total) * 100) : 0;
    const valorPipeline = oportunidades.filter(o => o.etapa !== "cierre").reduce((s, o) => s + o.valorEstimado * (o.probabilidad / 100), 0);
    return { total, nuevos, visitas, matriculados, perdidos, conversion, valorPipeline };
  }, [leads, oportunidades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">CRM Comercial</h2>
          <p className="text-sm text-ink-500">{leads.length} leads · {pipelineStats.conversion}% conversión</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">
          + Nuevo lead
        </button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-ink-900">{pipelineStats.total}</p>
          <p className="text-xs text-ink-500">Total leads</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-blue-600">{pipelineStats.nuevos}</p>
          <p className="text-xs text-ink-500">Nuevos</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-amber-600">{pipelineStats.visitas}</p>
          <p className="text-xs text-ink-500">Visitas</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-emerald-600">{pipelineStats.matriculados}</p>
          <p className="text-xs text-ink-500">Matriculados</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-ink-500">{pipelineStats.perdidos}</p>
          <p className="text-xs text-ink-500">Perdidos</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-bold text-coral-600">{pipelineStats.valorPipeline.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-ink-500">Pipeline ponderado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Buscar lead..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-white shadow-sm border border-gray-200 rounded-xl text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-coral-500/50" />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="select px-3 py-2 rounded-xl text-sm border border-gray-200">
          <option value="todos">Todos los estados</option>
          {Object.entries(estadosLead).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla de leads */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-ink-500 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Lead</th>
                <th className="text-left px-4 py-3 font-medium">Contacto</th>
                <th className="text-left px-4 py-3 font-medium">Hijo</th>
                <th className="text-left px-4 py-3 font-medium">Fuente</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Probabilidad</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-right px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const ops = oportunidades.filter(o => o.leadId === l.id);
                const isExpanded = expandedId === l.id;
                return (
                  <tr key={l.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-100' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : l.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{l.nombre}</p>
                      <p className="text-xs text-ink-400">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{l.telefono}</p>
                      <p className="text-xs text-ink-400">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {l.nombreHijo ? <><p className="text-sm">{l.nombreHijo}</p><p className="text-xs text-ink-400">{l.edadHijo}</p></> : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{l.fuente === "recomendacion" ? "Recomendación" : l.fuente}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${estadosLead[l.estado].color}`}>{estadosLead[l.estado].label}</span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <EditableProbabilidad leadId={l.id} pct={l.probabilidadCierre || 0} onUpdate={(v) => updateLead(l.id, { probabilidadCierre: v })} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{l.fechaContacto}</p>
                      {l.fechaVisita && <p className="text-xs text-amber-600">Visita: {l.fechaVisita}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <select value={l.estado} onChange={e => { e.stopPropagation(); updateLead(l.id, { estado: e.target.value as EstadoLead }); }}
                          className="select text-xs px-2 py-1 rounded-lg border border-gray-200 w-28">
                          {Object.entries(estadosLead).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar este lead?')) removeLead(l.id); }}
                          className="p-1.5 text-ink-400 hover:text-red-600 transition-colors text-xs">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-ink-400 py-8">No se encontraron leads</p>
        )}
      </div>

      {/* Oportunidades section */}
      {oportunidades.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Oportunidades activas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {oportunidades.filter(o => o.etapa !== "cierre").map(op => {
              const lead = leads.find(l => l.id === op.leadId);
              const colorEtapa = op.etapa === "interes" ? "border-blue-500" : op.etapa === "visita" ? "border-amber-500" : op.etapa === "negociacion" ? "border-purple-500" : "border-emerald-500";
              const bgEtapa = op.etapa === "interes" ? "bg-blue-100 text-blue-700" : op.etapa === "visita" ? "bg-amber-100 text-amber-700" : op.etapa === "negociacion" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700";
              return (
                <div key={op.id} className={`bg-white shadow-sm border ${colorEtapa} border-l-4 rounded-xl p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{op.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${bgEtapa}`}>{op.etapa}</span>
                  </div>
                  <p className="text-xs text-ink-500 mb-1">Lead: {lead?.nombre || "—"}</p>
                  <p className="text-sm font-bold text-coral-600">{op.valorEstimado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/mes</p>
                  <ProbabilidadBar pct={op.probabilidad} />
                  <p className="text-xs text-ink-400 mt-1">Cierre estimado: {op.fechaEstimadaCierre}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal nuevo/editar lead */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{editingLead ? "Editar lead" : "Nuevo lead"}</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                nombre: fd.get("nombre") as string,
                email: fd.get("email") as string,
                telefono: fd.get("telefono") as string,
                nombreHijo: (fd.get("nombreHijo") as string) || undefined,
                edadHijo: (fd.get("edadHijo") as string) || undefined,
                fuente: fd.get("fuente") as FuenteLead,
              };
              if (editingLead) {
                updateLead(editingLead.id, data);
              } else {
                const nuevo: Lead = {
                  id: `ld-${Date.now()}`,
                  ...data,
                  estado: "nuevo",
                  fechaContacto: new Date().toISOString().split("T")[0],
                  probabilidadCierre: 15,
                };
                addLead(nuevo);
              }
              setShowForm(false);
              setEditingLead(null);
            }}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink-700">Nombre completo <span className="text-coral-600">*</span></label>
                  <input name="nombre" defaultValue={editingLead?.nombre || ""} required
                    className="w-full input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-700">Email <span className="text-coral-600">*</span></label>
                    <input name="email" type="email" defaultValue={editingLead?.email || ""} required
                      className="w-full input" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-700">Teléfono <span className="text-coral-600">*</span></label>
                    <input name="telefono" defaultValue={editingLead?.telefono || ""} required
                      className="w-full input" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-ink-700">Fuente de captación <span className="text-coral-600">*</span></label>
                  <select name="fuente" defaultValue={editingLead?.fuente || ""} required className="select w-full px-3 py-2 rounded-xl text-sm border border-gray-200">
                    <option value="">Seleccionar fuente...</option>
                    {fuentes.map(f => <option key={f} value={f}>{f === "recomendacion" ? "Recomendación" : f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-700">Nombre del hijo</label>
                    <input name="nombreHijo" defaultValue={editingLead?.nombreHijo || ""}
                      className="w-full input" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-ink-700">Edad del hijo</label>
                    <select name="edadHijo" defaultValue={editingLead?.edadHijo || ""} className="select w-full px-3 py-2 rounded-xl text-sm border border-gray-200">
                      <option value="">Seleccionar edad...</option>
                      <option value="lactantes">Lactantes</option>
                      <option value="1 año">1 año</option>
                      <option value="2 años">2 años</option>
                      <option value="3 años">3 años</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setEditingLead(null); }} className="px-4 py-2 text-sm text-ink-500 hover:text-ink-900 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">{editingLead ? "Guardar cambios" : "Crear lead"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
