"use client";

import { useStore } from "@/lib/data/useStore";
import { detectarAlertas } from "@/lib/ai/simulated";
import { eur } from "@/lib/format";
import { KPI } from "@/components/ui/KPI";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconEuro, IconAlert, IconUsers, IconBolt, IconBell } from "@/components/ui/Icons";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardView() {
  const { facturas, gastos, suministros, cargosPendientes, dashboardMetrics } = useStore();
  const router = useRouter();
  const [alertasDismissed, setAlertasDismissed] = useState<string[]>([]);

  const alertas = useMemo(() => {
    return detectarAlertas({ facturas, gastos, suministros, cargosPendientes }).filter(a => !alertasDismissed.includes(a.titulo));
  }, [facturas, gastos, suministros, cargosPendientes, alertasDismissed]);

  const { familiasCount, totalAlumnos, cobrado, pendiente, gastoMes, resultado, morosos, empleadosActivos, nominaTotal, cargosPendientesTotal, cargosVencidosCount } = dashboardMetrics;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Resumen ejecutivo — datos actualizados en tiempo real</p>
      </div>

      {alertas.length > 0 && (
        <div className="space-y-2">
          <div className="label">Alertas IA</div>
          <div className="grid gap-2">
            {alertas.map(a => (
              <div key={a.titulo} className={`card p-4 flex items-start justify-between gap-4 border-l-2 ${a.tipo === "critica" ? "border-l-red-500" : a.tipo === "aviso" ? "border-l-amber-500" : "border-l-blue-500"}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IconAlert width={14} height={14} className={a.tipo === "critica" ? "text-red-600" : a.tipo === "aviso" ? "text-amber-600" : "text-blue-600"} />
                    <span className="text-sm font-semibold text-ink-900">{a.titulo}</span>
                    <Badge variant={a.tipo === "critica" ? "danger" : a.tipo === "aviso" ? "warning" : "info"}>{a.tipo}</Badge>
                  </div>
                  <p className="text-sm text-ink-600">{a.detalle}</p>
                </div>
                {a.accion && (
                  <button onClick={() => setAlertasDismissed(prev => [...prev, a.titulo])}
                    className="text-xs text-coral-500 hover:text-coral-500 whitespace-nowrap shrink-0">
                    {a.accion}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Familias activas" value={String(familiasCount)} icon={<IconUsers width={16} height={16} />} subtitle={`${totalAlumnos} alumnos`} />
        <KPI label="Cobrado" value={eur(cobrado)} icon={<IconEuro width={16} height={16} />} trend="up" subtitle="total facturado" />
        <KPI label="Pendiente" value={eur(pendiente)} icon={<IconEuro width={16} height={16} />} trend="down" subtitle={`${morosos} morosos`} />
        <KPI label="Resultado" value={eur(resultado)} icon={<IconBolt width={16} height={16} />} trend={resultado > 0 ? "up" : "down"} subtitle="ingresos - gastos" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Empleados" value={String(empleadosActivos)} subtitle={`Coste ${eur(nominaTotal)}/mes`} trend={empleadosActivos > 0 ? "up" : "neutral"} />
        <KPI label="Gasto del mes" value={eur(gastoMes)} subtitle={(() => { const m = new Date(); return ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m.getMonth()] + " " + m.getFullYear(); })()} trend="neutral" />
        <KPI label="Morosos" value={String(morosos)} trend="down" subtitle={morosos === 1 ? "1 familia" : `${morosos} familias`} />
        <KPI label="Cargos pendientes" value={eur(cargosPendientesTotal)} icon={<IconBell width={16} height={16} />} trend={cargosVencidosCount > 0 ? "down" : "neutral"} subtitle={`${cargosVencidosCount} vencidos`} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Cargos pendientes por alumno</CardTitle></CardHeader>
          <div className="space-y-3">
            {cargosPendientes.filter(c => c.estado === "pendiente").slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-200/40 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink-900">{c.alumnoNombre}</div>
                  <div className="text-xs text-ink-500">{c.concepto} · {c.tipo}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ink-900">{eur(c.importe)}</span>
                  {c.fechaVencimiento < new Date().toISOString().slice(0, 10) && (
                    <div className="text-[10px] text-red-500 font-medium">VENCIDO</div>
                  )}
                </div>
              </div>
            ))}
            {cargosPendientes.filter(c => c.estado === "pendiente").length === 0 && (
              <p className="text-sm text-ink-500 text-center py-4">✅ No hay cargos pendientes</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => router.push("/familias")}>Gestionar cargos</Button>
        </Card>
        <Card>
          <CardHeader><CardTitle>Últimos cobros</CardTitle></CardHeader>
          <div className="space-y-3">
            {facturas.filter(f => f.estado === "pagada").slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div><div className="text-sm font-medium text-ink-900">{f.familia}</div><div className="text-xs text-ink-500">{f.periodo}</div></div>
                <Badge variant="success">{eur(f.total)}</Badge>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => router.push("/facturacion")}>Ver todas las facturas</Button>
        </Card>
        <Card>
          <CardHeader><CardTitle>Impagos detectados</CardTitle></CardHeader>
          <div className="space-y-3">
            {facturas.filter(f => f.estado === "impago").slice(0, 5).map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div><div className="text-sm font-medium text-ink-900">{f.familia}</div><div className="text-xs text-ink-500">{f.diasImpago} días de impago · {f.numero}</div></div>
                <Badge variant="danger">{eur(f.total)}</Badge>
              </div>
            ))}
            {facturas.filter(f => f.estado === "impago").length === 0 && (
              <p className="text-sm text-ink-500 text-center py-4">✅ No hay impagos</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => router.push("/asistente")}>Consultar al agente IA</Button>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Acciones rápidas</CardTitle></CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Button variant="secondary" size="sm" onClick={() => router.push("/contabilidad")}>Subir factura (OCR)</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/facturacion")}>Generar remesa SEPA</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/familias")}>Gestionar cargos</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/asistente")}>Preguntar al agente IA</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/previsiones")}>Ver balance financiero</Button>
        </div>
      </Card>
    </div>
  );
}
