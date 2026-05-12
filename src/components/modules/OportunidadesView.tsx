"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import type { Lead, EstadoLead, FuenteLead } from "@/types/crm";

const estadosLead: Record<EstadoLead, { label: string; color: string }> = {
  nuevo: { label: "Nuevo", color: "bg-blue-500/20 text-blue-400" },
  contactado: { label: "Contactado", color: "bg-purple-500/20 text-purple-400" },
  visita_programada: { label: "Visita programada", color: "bg-amber-500/20 text-amber-400" },
  visita_realizada: { label: "Visita realizada", color: "bg-cyan-500/20 text-cyan-400" },
  matriculado: { label: "Matriculado", color: "bg-emerald-500/20 text-emerald-400" },
  perdido: { label: "Perdido", color: "bg-red-500/20 text-red-400" },
  no_interesado: { label: "No interesado", color: "bg-charcoal-600/50 text-charcoal-400" },
};

const fuentes: FuenteLead[] = ["web", "recomendacion", "google", "instagram", "facebook", "llamada", "email", "otro"];

function ProbabilidadBar({ pct }: { pct: number }) {
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-charcoal-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-charcoal-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function OportunidadesView() {
  const { leads, oportunidades, addLead, updateLead, removeLead, addOportunidad, updateOportunidad, removeOportunidad } = useStore();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
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
          <p className="text-sm text-charcoal-400">{leads.length} leads · {pipelineStats.conversion}% conversión</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">
          + Nuevo lead
        </button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{pipelineStats.total}</p>
          <p className="text-xs text-charcoal-400">Total leads</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{pipelineStats.nuevos}</p>
          <p className="text-xs text-charcoal-400">Nuevos</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{pipelineStats.visitas}</p>
          <p className="text-xs text-charcoal-400">Visitas</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{pipelineStats.matriculados}</p>
          <p className="text-xs text-charcoal-400">Matriculados</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-charcoal-400">{pipelineStats.perdidos}</p>
          <p className="text-xs text-charcoal-400">Perdidos</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-coral-400">{pipelineStats.valorPipeline.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
          <p className="text-xs text-charcoal-400">Pipeline ponderado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Buscar lead..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-charcoal-800/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="select px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
          <option value="todos">Todos los estados</option>
          {Object.entries(estadosLead).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla de leads */}
      <div className="bg-charcoal-800/20 border border-charcoal-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-700/50 text-charcoal-400 text-xs uppercase">
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
                  <tr key={l.id} className={`border-b border-charcoal-800/50 hover:bg-charcoal-800/30 cursor-pointer ${isExpanded ? 'bg-charcoal-800/30' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : l.id)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{l.nombre}</p>
                      <p className="text-xs text-charcoal-500">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{l.telefono}</p>
                      <p className="text-xs text-charcoal-500">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {l.nombreHijo ? <><p className="text-sm">{l.nombreHijo}</p><p className="text-xs text-charcoal-500">{l.edadHijo}</p></> : <span className="text-charcoal-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{l.fuente === "recomendacion" ? "Recomendación" : l.fuente}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${estadosLead[l.estado].color}`}>{estadosLead[l.estado].label}</span>
                    </td>
                    <td className="px-4 py-3 w-32">
                      <ProbabilidadBar pct={l.probabilidadCierre || 0} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{l.fechaContacto}</p>
                      {l.fechaVisita && <p className="text-xs text-amber-400">Visita: {l.fechaVisita}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <select value={l.estado} onChange={e => { e.stopPropagation(); updateLead(l.id, { estado: e.target.value as EstadoLead }); }}
                          className="select text-xs px-2 py-1 rounded-lg border border-charcoal-700/50 w-28">
                          {Object.entries(estadosLead).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar este lead?')) removeLead(l.id); }}
                          className="p-1.5 text-charcoal-500 hover:text-red-400 transition-colors text-xs">✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-charcoal-500 py-8">No se encontraron leads</p>
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
              return (
                <div key={op.id} className={`bg-charcoal-800/30 border ${colorEtapa} border-l-4 rounded-xl p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{op.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colorEtapa} bg-opacity-20 text-white`}>{op.etapa}</span>
                  </div>
                  <p className="text-xs text-charcoal-400 mb-1">Lead: {lead?.nombre || "—"}</p>
                  <p className="text-sm font-bold text-coral-400">{op.valorEstimado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}/mes</p>
                  <ProbabilidadBar pct={op.probabilidad} />
                  <p className="text-xs text-charcoal-500 mt-1">Cierre estimado: {op.fechaEstimadaCierre}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal nuevo lead */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-charcoal-800 border border-charcoal-700/50 rounded-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nuevo lead</h3>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const nuevo: Lead = {
                id: `ld-${Date.now()}`,
                nombre: fd.get("nombre") as string,
                email: fd.get("email") as string,
                telefono: fd.get("telefono") as string,
                nombreHijo: (fd.get("nombreHijo") as string) || undefined,
                edadHijo: (fd.get("edadHijo") as string) || undefined,
                fuente: fd.get("fuente") as FuenteLead,
                estado: "nuevo",
                fechaContacto: new Date().toISOString().split("T")[0],
                probabilidadCierre: 15,
              };
              addLead(nuevo);
              setShowForm(false);
            }}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input name="nombre" placeholder="Nombre completo" required
                    className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
                  <input name="email" type="email" placeholder="Email" required
                    className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="telefono" placeholder="Teléfono" required
                    className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
                  <select name="fuente" required className="select w-full px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
                    <option value="">Fuente</option>
                    {fuentes.map(f => <option key={f} value={f}>{f === "recomendacion" ? "Recomendación" : f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="nombreHijo" placeholder="Nombre del hijo (opcional)"
                    className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
                  <select name="edadHijo" className="select w-full px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
                    <option value="">Edad del hijo</option>
                    <option value="lactantes">Lactantes</option>
                    <option value="1 año">1 año</option>
                    <option value="2 años">2 años</option>
                    <option value="3 años">3 años</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-charcoal-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">Crear lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
