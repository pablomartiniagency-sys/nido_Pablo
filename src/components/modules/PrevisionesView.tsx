"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/data/useStore";
import { generarReporteFinanciero, calcularRatios } from "@/lib/financial-engine";
import { eur, pct } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";

type TabSection = "pyg" | "balance" | "ratios" | "proyeccion";

export function PrevisionesView() {
  const { facturas, gastos } = useStore();
  const router = useRouter();

  const reporte = useMemo(() => generarReporteFinanciero(facturas, gastos, ""), [facturas, gastos]);
  const ratios = useMemo(() => calcularRatios(reporte), [reporte]);

  const tabs: { key: TabSection; label: string }[] = [
    { key: "pyg", label: "P&G" },
    { key: "balance", label: "Balance" },
    { key: "ratios", label: "Ratios" },
    { key: "proyeccion", label: "Proyección" },
  ];
  const [tab, setTab] = useState<TabSection>("pyg");

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Estados Financieros" description="Cuenta de resultados, balance, EBITDA y ratios financieros" />

      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${tab === t.key ? "bg-coral-500/20 text-coral-300 border border-coral-500/30" : "text-white/50 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pyg" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="label mb-1">Ingresos totales</div><div className="text-xl font-bold text-emerald-400">{eur(reporte.ingresosTotales)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Gastos operativos</div><div className="text-xl font-bold text-red-400">{eur(reporte.gastosOperativos)}</div></Card>
            <Card className="p-4">
              <div className="label mb-1">EBITDA</div>
              <div className={`text-xl font-bold ${reporte.ebitda >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(reporte.ebitda)}</div>
            </Card>
            <Card className="p-4">
              <div className="label mb-1">Margen EBITDA</div>
              <div className={`text-xl font-bold ${reporte.margenEbitda >= 15 ? "text-emerald-400" : "text-amber-400"}`}>{pct(reporte.margenEbitda)}</div>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4"><div className="label mb-1">Amortización</div><div className="text-lg font-bold text-white">{eur(reporte.amortizacion)}</div></Card>
            <Card className="p-4"><div className="label mb-1">EBIT</div><div className={`text-lg font-bold ${reporte.ebit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(reporte.ebit)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Resultado neto</div><div className={`text-lg font-bold ${reporte.resultadoNeto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(reporte.resultadoNeto)}</div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Desglose de gastos operativos</CardTitle></CardHeader>
            <div className="space-y-3">
              {reporte.gastosPorCategoria.map(g => (
                <div key={g.categoria} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-sm text-white/70 capitalize w-32">{g.categoria}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-coral-500 to-coral-400 rounded-full" style={{ width: `${Math.min(g.pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-white/50 w-16 text-right">{pct(g.pct)}</span>
                  <span className="text-sm font-medium text-white w-24 text-right">{eur(g.importe)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "balance" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Activos</CardTitle></CardHeader>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/70">Tesorería / Caja</span>
                <span className="text-white font-medium">{eur(reporte.activos.caja)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/70">Clientes (pendiente cobro)</span>
                <span className="text-white font-medium">{eur(reporte.activos.clientes)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/70">Activos fijos (neto)</span>
                <span className="text-white font-medium">{eur(reporte.activos.activosFijos)}</span>
              </div>
              <div className="flex justify-between py-3 font-semibold">
                <span className="text-white">Total activos</span>
                <span className="text-emerald-400 text-lg">{eur(reporte.activos.total)}</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pasivos y Patrimonio</CardTitle></CardHeader>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/70">Proveedores pendientes</span>
                <span className="text-white font-medium">{eur(reporte.pasivos.proveedores)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-white/70">Admin. Pública (IVA/SS)</span>
                <span className="text-white font-medium">{eur(reporte.pasivos.adminPub)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/[0.04] font-semibold">
                <span className="text-white">Total pasivos</span>
                <span className="text-red-400">{eur(reporte.pasivos.total)}</span>
              </div>
              <div className="flex justify-between py-3 font-semibold">
                <span className="text-white">Patrimonio neto</span>
                <span className={`text-lg ${reporte.patrimonioNeto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(reporte.patrimonioNeto)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "ratios" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ratios).map(([key, r]) => (
              <Card key={key} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="label">{r.label}</div>
                  <div className={`w-2 h-2 rounded-full ${r.healthy ? "bg-emerald-400" : "bg-amber-400"}`} />
                </div>
                <div className={`text-2xl font-bold ${r.healthy ? "text-emerald-400" : "text-amber-400"}`}>
                  {typeof r.value === "number" && r.label.includes("%") || r.label.includes("Margen") || r.label.includes("Rentabilidad")
                    ? pct(r.value)
                    : r.label === "EBITDA" || r.label === "EBIT"
                    ? eur(r.value)
                    : r.value.toFixed(2)}
                </div>
                <div className="text-xs text-white/40 mt-2">
                  {r.healthy ? "✅ Saludable" : "⚠️ Requiere atención"}
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <div className="label mb-2">Interpretación</div>
            <div className="text-sm text-white/70 space-y-2">
              <p>Un margen EBITDA saludable en escuelas infantiles es &gt;15%. El ratio de liquidez debe ser &gt;1.5 para garantizar solvencia a corto plazo. El endeudamiento recomendado es &lt;0.5.</p>
              {reporte.margenEbitda < 15 && <p className="text-amber-400">⚠️ El margen EBITDA está por debajo del recomendado. Revisa gastos operativos o ajusta precios.</p>}
              {reporte.liquidez < 1.5 && <p className="text-amber-400">⚠️ La liquidez es baja. Considera reducir plazo de cobro o renegociar pagos a proveedores.</p>}
              {reporte.endeudamiento > 0.5 && <p className="text-amber-400">⚠️ El nivel de endeudamiento es elevado. Evita nuevas deudas hasta reducir la ratio.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === "proyeccion" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {reporte.proyeccionTrimestral.map(p => (
              <Card key={p.trimestre} className="p-5">
                <div className="label mb-2">{p.trimestre}</div>
                <div className="text-2xl font-bold text-white mb-3">{eur(p.ebitda)}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Ingresos</span><span className="text-emerald-400">{eur(p.ingresos)}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Gastos</span><span className="text-red-400">{eur(p.gastos)}</span></div>
                  <div className="flex justify-between font-medium"><span>EBITDA</span><span className={p.ebitda >= 0 ? "text-emerald-400" : "text-red-400"}>{eur(p.ebitda)}</span></div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Recomendaciones financieras</CardTitle></CardHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 mt-0.5">💡</span>
                <div>
                  <div className="font-medium text-emerald-300">Optimización de costes</div>
                  <div className="text-white/60">Los gastos de {reporte.gastosPorCategoria[0]?.categoria} representan {reporte.gastosPorCategoria[0] ? pct(reporte.gastosPorCategoria[0].pct) : "—"} del total. Revisa si hay margen de ahorro.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 mt-0.5">📊</span>
                <div>
                  <div className="font-medium text-blue-300">Estacionalidad</div>
                  <div className="text-white/60">Agosto y diciembre suelen tener menor facturación. Planifica tus gastos fijos considerando estos meses valle.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-400 mt-0.5">⚠️</span>
                <div>
                  <div className="font-medium text-amber-300">Morosidad</div>
                  <div className="text-white/60">Tienes {eur(reporte.ingresosPendientes)} pendiente de cobro. Activa la remesa SEPA o revisa los plazos de pago.</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <button onClick={() => router.push("/asistente")}
              className="px-6 py-3 rounded-xl bg-coral-500/20 border border-coral-500/30 text-coral-300 text-sm font-medium hover:bg-coral-500/30 transition">
              Preguntar al agente IA sobre estos datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
