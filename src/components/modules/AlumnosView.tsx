"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import type { AlumnoPerfil, EstadoAsistencia, RegistroAsistencia, EstadoAlumno } from "@/types/crm";

const estadosAlumno: Record<string, string> = {
  activo: "🟢 Activo",
  inactivo: "⚪ Inactivo",
  prematricula: "🟡 Pre-matrícula",
  baja: "🔴 Baja",
};

const coloresEstadoAsistencia: Record<EstadoAsistencia, string> = {
  presente: "bg-emerald-500/20 text-emerald-400",
  ausente: "bg-red-500/20 text-red-400",
  justificado: "bg-amber-500/20 text-amber-400",
  tarde: "bg-cyan-500/20 text-cyan-400",
};

function getEdad(fechaNac: string): string {
  if (!fechaNac) return "";
  const nac = new Date(fechaNac);
  const hoy = new Date();
  let años = hoy.getFullYear() - nac.getFullYear();
  const meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0) { años--; }
  return años < 1 ? `${meses + 12}m` : `${años}a ${meses >= 0 ? meses : meses + 12}m`;
}

function AlumnoCard({ alumno, selected, onClick }: { alumno: AlumnoPerfil; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        selected
          ? "border-coral-500 bg-coral-500/10 shadow-glow-sm"
          : "border-charcoal-700/50 bg-charcoal-800/50 hover:border-charcoal-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center text-coral-400 font-bold text-sm">
          {alumno.nombre.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{alumno.nombre}</p>
          <p className="text-xs text-charcoal-400">{alumno.curso} · {getEdad(alumno.fechaNac)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${alumno.estado === "activo" ? "bg-emerald-500/20 text-emerald-400" : alumno.estado === "baja" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
          {estadosAlumno[alumno.estado].split(" ")[1]}
        </span>
      </div>
    </button>
  );
}

function AsistenciaTable({ alumnoId, asistencia }: { alumnoId: string; asistencia: RegistroAsistencia[] }) {
  const records = useMemo(() => asistencia.filter(r => r.alumnoId === alumnoId).sort((a, b) => b.fecha.localeCompare(a.fecha)), [alumnoId, asistencia]);
  const presentes = records.filter(r => r.estado === "presente").length;
  const ausencias = records.filter(r => r.estado === "ausente").length;
  const justificados = records.filter(r => r.estado === "justificado").length;
  const total = records.length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{presentes}</p>
          <p className="text-xs text-charcoal-400">Presentes</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{ausencias}</p>
          <p className="text-xs text-charcoal-400">Ausencias</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{justificados}</p>
          <p className="text-xs text-charcoal-400">Justificados</p>
        </div>
        <div className="bg-charcoal-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-charcoal-400">Total</p>
        </div>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {records.map(r => (
          <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-charcoal-800/30">
            <span className="text-sm">{r.fecha}</span>
            <div className="flex items-center gap-2">
              {r.horaEntrada && <span className="text-xs text-charcoal-400">Ent: {r.horaEntrada}</span>}
              {r.horaSalida && <span className="text-xs text-charcoal-400">Sal: {r.horaSalida}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${coloresEstadoAsistencia[r.estado]}`}>
                {r.estado}
              </span>
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-charcoal-400 text-sm text-center py-4">Sin registros de asistencia</p>}
      </div>
    </div>
  );
}

function InfoMedica({ alumno }: { alumno: AlumnoPerfil }) {
  return (
    <div className="space-y-4">
      {/* Alergias */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Alergias</h4>
        {alumno.alergias.length === 0 ? (
          <p className="text-sm text-charcoal-500">Sin alergias registradas</p>
        ) : alumno.alergias.map((a, i) => (
          <div key={i} className={`px-3 py-2 rounded-lg mb-1 ${
            a.gravedad === "grave" ? "bg-red-500/10 border border-red-500/30" :
            a.gravedad === "moderada" ? "bg-amber-500/10 border border-amber-500/30" :
            "bg-charcoal-800/50"
          }`}>
            <p className="text-sm font-medium">{a.desencadenante}</p>
            <p className="text-xs text-charcoal-400">{a.tipo} · Gravedad: {a.gravedad}</p>
            {a.observaciones && <p className="text-xs text-charcoal-500 mt-1">{a.observaciones}</p>}
          </div>
        ))}
      </div>

      {/* Vacunas */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Vacunas</h4>
        {alumno.vacunas.length === 0 ? (
          <p className="text-sm text-charcoal-500">Sin registro de vacunas</p>
        ) : alumno.vacunas.map((v, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-charcoal-800/50 mb-1">
            <span className="text-sm">{v.nombre}</span>
            <span className="text-xs text-charcoal-400">{v.fecha}</span>
          </div>
        ))}
      </div>

      {/* Contactos */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Contactos de emergencia</h4>
        {alumno.contactosEmergencia.map((c, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-charcoal-800/50 mb-1">
            <span className="text-sm">{c.nombre} <span className="text-xs text-charcoal-400">({c.relacion})</span></span>
            <span className="text-xs text-coral-400">{c.telefono}</span>
          </div>
        ))}
      </div>

      {/* Autorizados recogida */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Autorizados para recoger</h4>
        <ul className="space-y-1">
          {alumno.autorizadosRecogida.map((n, i) => (
            <li key={i} className="text-sm text-charcoal-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* Documentación */}
      <div>
        <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Documentos</h4>
        {alumno.documentos.length === 0 ? (
          <p className="text-sm text-charcoal-500">Sin documentos</p>
        ) : alumno.documentos.map((d, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-charcoal-800/50 mb-1">
            <div>
              <p className="text-sm">{d.nombre}</p>
              <p className="text-xs text-charcoal-400">{d.tipo}</p>
            </div>
            <span className="text-xs text-charcoal-500">{d.fecha}</span>
          </div>
        ))}
      </div>

      {alumno.observaciones && (
        <div>
          <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Observaciones</h4>
          <p className="text-sm text-charcoal-400 bg-charcoal-800/30 p-3 rounded-lg">{alumno.observaciones}</p>
        </div>
      )}
      {alumno.necesidadesEspeciales && (
        <div>
          <h4 className="text-sm font-semibold text-charcoal-300 mb-2">Necesidades especiales</h4>
          <p className="text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">{alumno.necesidadesEspeciales}</p>
        </div>
      )}
    </div>
  );
}

export default function AlumnosView() {
  const { alumnos, asistencia, familias, addAlumno, updateAlumno, addAsistencia } = useStore();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroCurso, setFiltroCurso] = useState<string>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"perfil" | "asistencia" | "medica">("perfil");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return alumnos.filter(a => {
      if (filtroEstado !== "todos" && a.estado !== filtroEstado) return false;
      if (filtroCurso !== "todos" && a.curso !== filtroCurso) return false;
      if (search) return a.nombre.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [alumnos, search, filtroEstado, filtroCurso]);

  const selected = useMemo(() => alumnos.find(a => a.id === selectedId) || null, [alumnos, selectedId]);

  const cursos = useMemo(() => Array.from(new Set(alumnos.map(a => a.curso))), [alumnos]);

  const handleNuevoAlumno = () => setShowForm(true);

  const totalActivos = alumnos.filter(a => a.estado === "activo").length;
  const totalPrematricula = alumnos.filter(a => a.estado === "prematricula").length;
  const totalBajas = alumnos.filter(a => a.estado === "baja").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">CRM de Alumnos</h2>
          <p className="text-sm text-charcoal-400">{alumnos.length} estudiantes · {totalActivos} activos · {totalPrematricula} pre-matrículas · {totalBajas} bajas</p>
        </div>
        <button onClick={handleNuevoAlumno} className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">
          + Nuevo alumno
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text" placeholder="Buscar alumno..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-charcoal-800/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50"
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="select px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="prematricula">Pre-matrícula</option>
          <option value="baja">Baja</option>
        </select>
        <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
          className="select px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
          <option value="todos">Todos los cursos</option>
          {cursos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista */}
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {filtered.map(a => (
            <AlumnoCard key={a.id} alumno={a} selected={selectedId === a.id} onClick={() => setSelectedId(a.id)} />
          ))}
          {filtered.length === 0 && (
            <p className="text-charcoal-400 text-center py-8">No se encontraron alumnos</p>
          )}
        </div>

        {/* Detalle */}
        <div className="bg-charcoal-800/30 border border-charcoal-700/50 rounded-2xl p-5 min-h-[400px]">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-charcoal-500 py-16">
              <p className="text-lg mb-2">Selecciona un alumno</p>
              <p className="text-sm">Haz clic en un alumno para ver su perfil completo</p>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-coral-500/20 flex items-center justify-center text-coral-400 font-bold text-lg">
                    {selected.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selected.nombre}</h3>
                    <p className="text-sm text-charcoal-400">
                      {selected.curso} · {getEdad(selected.fechaNac)} · Ingreso: {selected.fechaIngreso}
                    </p>
                    <p className="text-xs text-charcoal-500">{familias.find(f => f.id === selected.familiaId)?.nombre || "Sin familia"}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  selected.estado === "activo" ? "bg-emerald-500/20 text-emerald-400" :
                  selected.estado === "baja" ? "bg-red-500/20 text-red-400" :
                  selected.estado === "prematricula" ? "bg-amber-500/20 text-amber-400" :
                  "bg-charcoal-700 text-charcoal-300"
                }`}>{estadosAlumno[selected.estado]}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-charcoal-700/50 pb-1">
                {(["perfil", "asistencia", "medica"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
                      tab === t ? "bg-charcoal-700/50 text-white font-medium" : "text-charcoal-400 hover:text-charcoal-200"
                    }`}>
                    {t === "perfil" ? "Perfil" : t === "asistencia" ? "Asistencia" : "Médico"}
                  </button>
                ))}
              </div>

              {/* Content */}
              {tab === "perfil" && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-charcoal-800/50 p-3 rounded-xl">
                      <p className="text-charcoal-400 text-xs">Fecha nacimiento</p>
                      <p className="font-medium">{selected.fechaNac}</p>
                    </div>
                    <div className="bg-charcoal-800/50 p-3 rounded-xl">
                      <p className="text-charcoal-400 text-xs">Edad</p>
                      <p className="font-medium">{getEdad(selected.fechaNac)}</p>
                    </div>
                    <div className="bg-charcoal-800/50 p-3 rounded-xl">
                      <p className="text-charcoal-400 text-xs">Curso</p>
                      <p className="font-medium">{selected.curso}</p>
                    </div>
                    <div className="bg-charcoal-800/50 p-3 rounded-xl">
                      <p className="text-charcoal-400 text-xs">Autorización imágenes</p>
                      <p className="font-medium">{selected.autorizacionImagen ? "✅ Sí" : "❌ No"}</p>
                    </div>
                  </div>
                  <div className="bg-charcoal-800/50 p-3 rounded-xl">
                    <p className="text-charcoal-400 text-xs">Autorizados para recoger</p>
                    <p className="font-medium">{selected.autorizadosRecogida.join(", ") || "Ninguno"}</p>
                  </div>
                </div>
              )}

              {tab === "asistencia" && (
                <AsistenciaTable alumnoId={selected.id} asistencia={asistencia} />
              )}

              {tab === "medica" && (
                <InfoMedica alumno={selected} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo alumno */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-charcoal-800 border border-charcoal-700/50 rounded-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Nuevo alumno</h3>
            <p className="text-sm text-charcoal-400 mb-4">Los cambios se guardan automáticamente en el modo demo.</p>
            <form onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const nuevo: AlumnoPerfil = {
                id: `al-${Date.now()}`,
                familiaId: fd.get("familiaId") as string,
                nombre: fd.get("nombre") as string,
                fechaNac: fd.get("fechaNac") as string,
                edad: getEdad(fd.get("fechaNac") as string),
                curso: fd.get("curso") as string,
                fechaIngreso: fd.get("fechaIngreso") as string,
                estado: (fd.get("estado") as EstadoAlumno) || "activo",
                alergias: [],
                vacunas: [],
                contactosEmergencia: [],
                autorizadosRecogida: [],
                documentos: [],
                autorizacionImagen: false,
              };
              addAlumno(nuevo);
              setShowForm(false);
              setSelectedId(nuevo.id);
            }}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-charcoal-300">Nombre completo <span className="text-coral-400">*</span></label>
                  <input name="nombre" placeholder="Ej: Martina García" required
                    className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white placeholder-charcoal-500 outline-none focus:border-coral-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-charcoal-300">Fecha de nacimiento <span className="text-coral-400">*</span></label>
                    <input name="fechaNac" type="date" required
                      className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white outline-none focus:border-coral-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-charcoal-300">Fecha de ingreso <span className="text-coral-400">*</span></label>
                    <input name="fechaIngreso" type="date" required
                      className="w-full px-4 py-2 bg-charcoal-900/70 border border-charcoal-700/50 rounded-xl text-sm text-white outline-none focus:border-coral-500/50" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-charcoal-300">Curso <span className="text-coral-400">*</span></label>
                  <select name="curso" required className="select w-full px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
                    <option value="">Seleccionar curso</option>
                    <option value="lactantes">Lactantes</option>
                    <option value="1 año">1 año</option>
                    <option value="2 años">2 años</option>
                    <option value="3 años">3 años</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-charcoal-300">Estado</label>
                  <select name="estado" className="select w-full px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
                    <option value="activo">Activo</option>
                    <option value="prematricula">Pre-matrícula</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-charcoal-300">Familia responsable <span className="text-coral-400">*</span></label>
                  <select name="familiaId" required className="select w-full px-3 py-2 rounded-xl text-sm border border-charcoal-700/50">
                    <option value="">Seleccionar familia</option>
                    {familias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-charcoal-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors text-sm font-medium">Crear alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
