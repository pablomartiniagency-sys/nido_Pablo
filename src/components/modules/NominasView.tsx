"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/data/useStore";
import { eur } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { IconDownload, IconRefresh } from "@/components/ui/Icons";

export function NominasView() {
  const { nominas, empleados, updateNomina, generarNominasMes } = useStore();
  const { toast } = useToast();

  const [periodo, setPeriodo] = useState("Mayo 2026");
  const periodos = useMemo(() => { const s = new Set(nominas.map(n => n.periodo)); return Array.from(s).sort(); }, [nominas]);

  const nominasMes = useMemo(() => nominas.filter(n => n.periodo === periodo), [nominas, periodo]);

  const totales = useMemo(() => ({
    bruto: nominasMes.reduce((s, n) => s + n.bruto, 0),
    irpf: nominasMes.reduce((s, n) => s + n.irpf, 0),
    ssEmpleado: nominasMes.reduce((s, n) => s + n.ssEmpleado, 0),
    ssEmpresa: nominasMes.reduce((s, n) => s + n.ssEmpresa, 0),
    neto: nominasMes.reduce((s, n) => s + n.neto, 0),
    pagadas: nominasMes.filter(n => n.pagada).length,
    total: nominasMes.length,
  }), [nominasMes]);

  const getEmpleado = (id: string) => empleados.find(e => e.id === id);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Nóminas" description={`${periodo} · ${nominasMes.length} nóminas`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { generarNominasMes(periodo); toast(`Nóminas generadas para ${periodo}`); }}>
              <IconRefresh width={14} height={14} /> Generar nóminas
            </Button>
            <Button size="sm" onClick={() => toast("SEPA de nóminas generado (demo)")}>
              <IconDownload width={14} height={14} /> SEPA nóminas
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <span className="label">Período:</span>
        <select className="select w-auto" value={periodo} onChange={e => setPeriodo(e.target.value)}>
          {periodos.length === 0 && <option>Mayo 2026</option>}
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><div className="label mb-1">Bruto total</div><div className="text-lg font-bold text-white">{eur(totales.bruto)}</div></Card>
        <Card className="p-4"><div className="label mb-1">IRPF</div><div className="text-lg font-bold text-white">{eur(totales.irpf)}</div></Card>
        <Card className="p-4"><div className="label mb-1">SS empleado</div><div className="text-lg font-bold text-white">{eur(totales.ssEmpleado)}</div></Card>
        <Card className="p-4"><div className="label mb-1">SS empresa</div><div className="text-lg font-bold text-white">{eur(totales.ssEmpresa)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Neto total</div><div className="text-lg font-bold text-emerald-400">{eur(totales.neto)}</div></Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="label mb-1">Coste total empresa</div><div className="text-lg font-bold text-white">{eur(totales.bruto + totales.ssEmpresa)}</div></Card>
        <Card className="p-4"><div className="label mb-1">Pagadas</div><div className="text-lg font-bold text-white">{totales.pagadas}/{totales.total}</div></Card>
        <Card className="p-4"><div className="label mb-1">Retención IRPF</div><div className="text-lg font-bold text-white">{eur(totales.irpf)}</div></Card>
        <Card className="p-4"><div className="label mb-1">A ingresar SS</div><div className="text-lg font-bold text-white">{eur(totales.ssEmpleado + totales.ssEmpresa)}</div></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalle nóminas — {periodo}</CardTitle></CardHeader>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Empleado</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Bruto</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">IRPF</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">SS Emp.</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">SS Cía.</th>
                <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Neto</th>
                <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase">Pagada</th>
                <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {nominasMes.map(n => {
                const emp = getEmpleado(n.empleadoId);
                return (
                  <tr key={n.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{emp?.nombre ?? "—"}</td>
                    <td className="py-3 px-3 text-right text-white">{eur(n.bruto)}</td>
                    <td className="py-3 px-3 text-right text-white/70">{eur(n.irpf)}</td>
                    <td className="py-3 px-3 text-right text-white/70">{eur(n.ssEmpleado)}</td>
                    <td className="py-3 px-3 text-right text-white/70">{eur(n.ssEmpresa)}</td>
                    <td className="py-3 px-3 text-right font-medium text-emerald-400">{eur(n.neto)}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={n.pagada ? "success" : "warning"}>{n.pagada ? "Sí" : "No"}</Badge>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {!n.pagada && (
                        <button onClick={() => { updateNomina(n.id, { pagada: true }); toast("Nómina pagada"); }}
                          className="text-xs text-emerald-400 hover:text-emerald-300">Pagar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Resumen obligaciones fiscales</CardTitle></CardHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-white/50">IRPF (retención)</span><span className="text-white font-medium">{eur(totales.irpf)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">SS empleado</span><span className="text-white font-medium">{eur(totales.ssEmpleado)}</span></div>
            <div className="flex justify-between"><span className="text-white/50">SS empresa</span><span className="text-white font-medium">{eur(totales.ssEmpresa)}</span></div>
            <div className="border-t border-white/[0.06] pt-3 flex justify-between font-semibold">
              <span className="text-white/70">Total a ingresar</span>
              <span className="text-coral-400">{eur(totales.irpf + totales.ssEmpleado + totales.ssEmpresa)}</span>
            </div>
          </div>
        </Card>
        <Card><CardHeader><CardTitle>Próximos vencimientos</CardTitle></CardHeader>
          <div className="space-y-3">
            {[{ label: "Modelo 111 — IRPF", tipo: "Trimestral", fecha: "20 jul 2026" }, { label: "Seguridad Social (TC1/TC2)", tipo: "Mensual", fecha: "30 jun 2026" }].map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div><div className="text-sm font-medium text-white">{v.label}</div><div className="text-xs text-white/40">{v.tipo}</div></div>
                <span className="text-sm font-medium text-white">{v.fecha}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
