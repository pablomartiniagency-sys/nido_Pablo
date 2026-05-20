"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { IconDownload, IconFile } from "@/components/ui/Icons";

type AreaDesarrollo = {
  area: string;
  logros: string[];
  observaciones: string;
};

function generarInformeHTML(
  alumno: any,
  familia: any,
  asistencia: any[],
  areas: AreaDesarrollo[],
  periodo: string,
  escuela: any,
) {
  const presentes = asistencia.filter(a => a.estado === "presente" || a.estado === "tarde").length;
  const ausencias = asistencia.filter(a => a.estado === "ausente" || a.estado === "justificado").length;
  const total = asistencia.length;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Informe Séneca - ${alumno.nombre}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
  h1 { font-size: 16pt; color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 4px; }
  h2 { font-size: 13pt; color: #2e86c1; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 10pt; }
  th { background: #1a5276; color: white; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .logo { font-size: 18pt; font-weight: bold; color: #1a5276; }
  .info { background: #f0f4f8; padding: 12px; border-radius: 6px; margin: 10px 0; }
  .area { margin: 12px 0; padding: 10px; background: #fafafa; border-left: 3px solid #2e86c1; }
  .area h3 { margin: 0 0 6px 0; font-size: 11pt; color: #1a5276; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9pt; color: #666; text-align: center; }
</style></head>
<body>
<div class="header">
  <div class="logo">${escuela.nombre || "Escuela Infantil"}</div>
  <div>${escuela.nif || ""}</div>
</div>
<h1>Informe de Evaluación — ${periodo}</h1>
<p style="font-size:10pt;color:#555;">Sistema Séneca · Junta de Andalucía · Primer Ciclo Educación Infantil</p>

<div class="info">
  <strong>Alumno/a:</strong> ${alumno.nombre}<br>
  <strong>Fecha de nacimiento:</strong> ${alumno.fechaNac || "—"}<br>
  <strong>Curso:</strong> ${alumno.curso || "—"}<br>
  <strong>Grupo:</strong> ${alumno.grupo || "—"}<br>
  <strong>Fecha de ingreso:</strong> ${alumno.fechaIngreso || "—"}<br>
  <strong>Familia:</strong> ${familia?.nombre || "—"}
</div>

<h2>Resumen de Asistencia</h2>
<table>
  <tr><th>Indicador</th><th>Valor</th></tr>
  <tr><td>Días lectivos del período</td><td>${total}</td></tr>
  <tr><td>Asistencias</td><td>${presentes}</td></tr>
  <tr><td>Ausencias</td><td>${ausencias}</td></tr>
  <tr><td>Porcentaje de asistencia</td><td>${total > 0 ? Math.round(presentes/total*100) : 0}%</td></tr>
</table>

<h2>Desarrollo por Áreas</h2>
${areas.map(a => `
<div class="area">
  <h3>${a.area}</h3>
  <ul>${a.logros.map(l => `<li>${l}</li>`).join("")}</ul>
  ${a.observaciones ? `<p style="font-size:10pt;color:#555;margin-top:6px;"><em>${a.observaciones}</em></p>` : ""}
</div>`).join("")}

<h2>Observaciones Generales</h2>
<p>${alumno.observaciones || "Sin observaciones destacables en este período."}</p>
${alumno.necesidadesEspeciales ? `<p style="background:#fff3cd;padding:8px;border-radius:4px;"><strong>Necesidades específicas:</strong> ${alumno.necesidadesEspeciales}</p>` : ""}

<div class="footer">
  <p>Informe generado desde Nido · ${new Date().toLocaleDateString("es-ES")}</p>
  <p>Este documento es un borrador para cumplimentar en Séneca.</p>
</div>
</body></html>`;
}

const AREAS_DESARROLLO: AreaDesarrollo[] = [
  { area: "Desarrollo Cognitivo", logros: ["Explora objetos y materiales del entorno", "Muestra curiosidad por actividades nuevas", "Comienza a establecer relaciones causa-efecto", "Identifica colores, formas y tamaños básicos"], observaciones: "" },
  { area: "Desarrollo Motor", logros: ["Coordina movimientos gruesos (gatear, caminar, correr)", "Desarrolla motricidad fina (pinza, garabateo)", "Participa en actividades psicomotrices", "Muestra control postural adecuado a su edad"], observaciones: "" },
  { area: "Desarrollo del Lenguaje", logros: ["Comprende órdenes sencillas", "Se expresa verbalmente según su edad", "Mantiene atención en cuentos y canciones", "Utiliza lenguaje gestual y corporal"], observaciones: "" },
  { area: "Desarrollo Socioafectivo", logros: ["Se relaciona con iguales y adultos", "Comparte y respeta turnos", "Expresa emociones básicas", "Participa en actividades grupales"], observaciones: "" },
  { area: "Desarrollo de la Autonomía", logros: ["Muestra iniciativa en rutinas diarias", "Colabora en el vestido/desvestido", "Controla esfínteres según su edad", "Recoge y ordena materiales"], observaciones: "" },
];

export default function SenecaView() {
  const { alumnos, asistencia, familias, configuracion } = useStore();
  const { toast } = useToast();
  const [alumnoId, setAlumnoId] = useState("");
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  const alumnosActivos = useMemo(() => alumnos.filter(a => a.estado === "activo"), [alumnos]);
  const alumnoSel = useMemo(() => alumnos.find(a => a.id === alumnoId), [alumnos, alumnoId]);
  const familiaSel = useMemo(() => alumnoSel ? familias.find(f => f.id === alumnoSel.familiaId) : null, [alumnoSel, familias]);
  const asistenciaSel = useMemo(() => alumnoId ? asistencia.filter(a => a.alumnoId === alumnoId && a.fecha.startsWith(periodo)) : [], [alumnoId, asistencia, periodo]);

  const handleGenerar = () => {
    if (!alumnoSel) { toast("Selecciona un alumno", "error"); return; }
    const areas = AREAS_DESARROLLO.map(a => ({
      ...a,
      observaciones: `El alumno/a muestra un progreso adecuado en esta área para su edad y etapa educativa.`,
    }));
    const html = generarInformeHTML(alumnoSel, familiaSel, asistenciaSel, areas, periodo, configuracion);
    const blob = new Blob([html], { type: "text/html;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seneca-${alumnoSel.nombre.replace(/\s/g, "-")}-${periodo}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Informe generado: ${alumnoSel.nombre}`);
  };

  if (configuracion.comunidadAutonoma !== "Andalucía") {
    return (
      <div className="space-y-8 animate-fadeIn">
        <PageHeader title="Séneca (Junta de Andalucía)" description="Informes de evaluación para el sistema Séneca" />
        <Card className="p-8 text-center">
          <IconFile width={48} height={48} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Módulo no disponible</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            El módulo Séneca está diseñado para centros educativos de Andalucía.
            Actívalo desde <strong>Configuración → Datos del centro</strong> seleccionando "Andalucía" como comunidad autónoma.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Séneca (Junta de Andalucía)" description="Genera informes de evaluación para cumplimentar en Séneca" />

      <Card>
        <CardHeader><CardTitle>Generar informe de evaluación</CardTitle></CardHeader>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label mb-1">Alumno</label>
            <select className="select" value={alumnoId} onChange={e => setAlumnoId(e.target.value)}>
              <option value="">Seleccionar alumno...</option>
              {alumnosActivos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.curso})</option>)}
            </select>
          </div>
          <div>
            <label className="label mb-1">Período</label>
            <input className="input" type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button size="sm" onClick={handleGenerar} disabled={!alumnoId}>
              <IconDownload width={14} height={14} /> Generar informe
            </Button>
          </div>
        </div>
      </Card>

      {alumnoSel && (
        <>
          <Card>
            <CardHeader><CardTitle>Vista previa: {alumnoSel.nombre}</CardTitle></CardHeader>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Curso</span><span className="text-white">{alumnoSel.curso}</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Grupo</span><span className="text-white">{alumnoSel.grupo || "—"}</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Familia</span><span className="text-white">{familiaSel?.nombre || "—"}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Asistencia</span><span className="text-white">{asistenciaSel.length} registros</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Presentes</span><span className="text-emerald-400">{asistenciaSel.filter(a => a.estado === "presente" || a.estado === "tarde").length}</span></div>
                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-white/50">Ausencias</span><span className="text-red-400">{asistenciaSel.filter(a => a.estado === "ausente" || a.estado === "justificado").length}</span></div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Áreas de desarrollo evaluadas</CardTitle></CardHeader>
            <div className="space-y-4">
              {AREAS_DESARROLLO.map(a => (
                <div key={a.area} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white mb-2">{a.area}</h3>
                  <ul className="space-y-1">
                    {a.logros.map((l, i) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span> {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
