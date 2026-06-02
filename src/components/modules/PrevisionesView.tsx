"use client";

import { useMemo, useState, useCallback } from "react";
import { useStore } from "@/lib/data/useStore";
import { generarReporteFinanciero, calcularRatios } from "@/lib/financial-engine";
import { eur, pct } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { IconEdit, IconCheck, IconX } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";

type TabSection = "pyg" | "balance" | "ratios";

type BalanceField = "caja" | "activosFijos" | "proveedores" | "adminPub" | "deudaCortoPlazo" | "deudaLargoPlazo";

function EditableBalanceRow({ label, value, field, editingField, editValue, isOverridden, onEdit, onSave, onCancel, onEditValueChange }: {
  label: string; value: number; field: BalanceField;
  editingField: BalanceField | null; editValue: string; isOverridden: boolean;
  onEdit: (f: BalanceField) => void; onSave: () => void; onCancel: () => void; onEditValueChange: (v: string) => void;
}) {
  const isEditing = editingField === field;
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200/60 group">
      <span className="text-ink-600 flex items-center gap-1">
        {label}
        {isOverridden && !isEditing && <span className="w-1.5 h-1.5 rounded-full bg-coral-400" title="Valor manual" />}
      </span>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              className="input w-24 text-right text-sm py-1"
              type="number" step="0.01" min="0"
              value={editValue}
              onChange={e => onEditValueChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
              autoFocus
            />
            <button onClick={onSave} className="text-emerald-500 hover:text-emerald-600"><IconCheck width={14} height={14} /></button>
            <button onClick={onCancel} className="text-ink-400 hover:text-ink-600"><IconX width={14} height={14} /></button>
          </>
        ) : (
          <>
            <span className="text-ink-900 font-medium">{eur(value)}</span>
            <button onClick={() => onEdit(field)} className="text-ink-400 hover:text-lapis-500 opacity-0 group-hover:opacity-100 transition-opacity"><IconEdit width={13} height={13} /></button>
          </>
        )}
      </div>
    </div>
  );
}

export function PrevisionesView() {
  const { facturas, gastos } = useStore();
  const router = useRouter();

  const reporte = useMemo(() => generarReporteFinanciero(facturas, gastos, ""), [facturas, gastos]);
  const ratios = useMemo(() => calcularRatios(reporte), [reporte]);

  const [balanceOverrides, setBalanceOverrides] = useState<Partial<Record<BalanceField, number>>>({});
  const [editingField, setEditingField] = useState<BalanceField | null>(null);
  const [editValue, setEditValue] = useState("");

  const getEffectiveBalance = useCallback(() => {
    const caja = balanceOverrides.caja ?? reporte.activos.caja;
    const activosFijos = balanceOverrides.activosFijos ?? reporte.activos.activosFijos;
    const clientes = reporte.activos.clientes;
    const totalActivos = caja + clientes + activosFijos;

    const proveedores = balanceOverrides.proveedores ?? reporte.pasivos.proveedores;
    const adminPub = balanceOverrides.adminPub ?? reporte.pasivos.adminPub;
    const deudaCortoPlazo = balanceOverrides.deudaCortoPlazo ?? 0;
    const deudaLargoPlazo = balanceOverrides.deudaLargoPlazo ?? 0;
    const totalPasivos = proveedores + adminPub + deudaCortoPlazo + deudaLargoPlazo;
    const patrimonioNeto = totalActivos - totalPasivos;

    return { caja, clientes, activosFijos, totalActivos, proveedores, adminPub, deudaCortoPlazo, deudaLargoPlazo, totalPasivos, patrimonioNeto };
  }, [reporte, balanceOverrides]);

  const eff = getEffectiveBalance();

  const startEditing = (field: BalanceField) => {
    setEditingField(field);
    const current = balanceOverrides[field] ??
      (field in reporte.activos ? reporte.activos[field as keyof typeof reporte.activos] :
       field in reporte.pasivos ? reporte.pasivos[field as keyof typeof reporte.pasivos] : 0);
    setEditValue(String(current ?? 0));
  };

  const saveEdit = () => {
    if (editingField) {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val >= 0) {
        setBalanceOverrides(prev => ({ ...prev, [editingField]: val }));
      }
      setEditingField(null);
    }
  };

  const cancelEdit = () => setEditingField(null);

  const resetOverrides = () => setBalanceOverrides({});

  const tabs: { key: TabSection; label: string }[] = [
    { key: "pyg", label: "P&G" },
    { key: "balance", label: "Balance" },
    { key: "ratios", label: "Ratios" },
  ];
  const [tab, setTab] = useState<TabSection>("pyg");

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Estados Financieros" description="Cuenta de resultados, balance, EBITDA y ratios financieros" />

      <div className="flex gap-1 bg-gray-50 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${tab === t.key ? "bg-coral-50 text-coral-600 border border-coral-200" : "text-ink-500 hover:text-ink-900"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pyg" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="label mb-1">Ingresos totales</div><div className="text-xl font-bold text-emerald-600">{eur(reporte.ingresosTotales)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Gastos operativos</div><div className="text-xl font-bold text-red-600">{eur(reporte.gastosOperativos)}</div></Card>
            <Card className="p-4">
              <div className="label mb-1">EBITDA</div>
              <div className={`text-xl font-bold ${reporte.ebitda >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(reporte.ebitda)}</div>
            </Card>
            <Card className="p-4">
              <div className="label mb-1">Margen EBITDA</div>
              <div className={`text-xl font-bold ${reporte.margenEbitda >= 15 ? "text-emerald-600" : "text-amber-600"}`}>{pct(reporte.margenEbitda)}</div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4"><div className="label mb-1">EBIT</div><div className={`text-lg font-bold ${reporte.ebit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(reporte.ebit)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Resultado neto</div><div className={`text-lg font-bold ${reporte.resultadoNeto >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(reporte.resultadoNeto)}</div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Desglose de gastos operativos</CardTitle></CardHeader>
            <div className="space-y-3">
              {reporte.gastosPorCategoria.map(g => (
                <div key={g.categoria} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-ink-600 capitalize w-32">{g.categoria}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-coral-500 to-coral-400 rounded-full" style={{ width: `${Math.min(g.pct, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-ink-400 w-16 text-right">{pct(g.pct)}</span>
                  <span className="text-sm font-medium text-ink-900 w-24 text-right">{eur(g.importe)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "balance" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activos</CardTitle>
                {Object.keys(balanceOverrides).length > 0 && (
                  <button onClick={resetOverrides} className="text-[10px] text-ink-400 hover:text-ink-600 underline">Restaurar valores estimados</button>
                )}
              </div>
            </CardHeader>
            <div className="space-y-3">
              <EditableBalanceRow
                label="Tesorería / Caja"
                value={eff.caja}
                field="caja"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"caja" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <div className="flex justify-between py-2 border-b border-gray-200/60">
                <span className="text-ink-600">Clientes (pendiente cobro)</span>
                <span className="text-ink-900 font-medium">{eur(eff.clientes)}</span>
              </div>
              <EditableBalanceRow
                label="Activos fijos (neto)"
                value={eff.activosFijos}
                field="activosFijos"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"activosFijos" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <div className="flex justify-between py-3 font-semibold">
                <span className="text-ink-900">Total activos</span>
                <span className="text-emerald-600 text-lg">{eur(eff.totalActivos)}</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pasivos y Patrimonio</CardTitle>
                {Object.keys(balanceOverrides).length > 0 && (
                  <button onClick={resetOverrides} className="text-[10px] text-ink-400 hover:text-ink-600 underline">Restaurar</button>
                )}
              </div>
            </CardHeader>
            <div className="space-y-3">
              <EditableBalanceRow
                label="Proveedores pendientes"
                value={eff.proveedores}
                field="proveedores"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"proveedores" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <EditableBalanceRow
                label="Admin. Pública (IVA/SS)"
                value={eff.adminPub}
                field="adminPub"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"adminPub" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <EditableBalanceRow
                label="Deuda a corto plazo"
                value={eff.deudaCortoPlazo}
                field="deudaCortoPlazo"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"deudaCortoPlazo" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <EditableBalanceRow
                label="Deuda a largo plazo"
                value={eff.deudaLargoPlazo}
                field="deudaLargoPlazo"
                editingField={editingField}
                editValue={editValue}
                isOverridden={"deudaLargoPlazo" in balanceOverrides}
                onEdit={startEditing}
                onSave={saveEdit}
                onCancel={cancelEdit}
                onEditValueChange={setEditValue}
              />
              <div className="flex justify-between py-3 border-b border-gray-200/60 font-semibold">
                <span className="text-ink-900">Total pasivos</span>
                <span className="text-red-600">{eur(eff.totalPasivos)}</span>
              </div>
              <div className="flex justify-between py-3 font-semibold">
                <span className="text-ink-900">Patrimonio neto</span>
                <span className={`text-lg ${eff.patrimonioNeto >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(eff.patrimonioNeto)}</span>
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
                  <div className={`w-2 h-2 rounded-full ${r.healthy ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
                <div className={`text-2xl font-bold ${r.healthy ? "text-emerald-600" : "text-amber-600"}`}>
                  {typeof r.value === "number" && r.label.includes("%") || r.label.includes("Margen") || r.label.includes("Rentabilidad")
                    ? pct(r.value)
                    : r.label === "EBITDA" || r.label === "EBIT"
                    ? eur(r.value)
                    : r.value.toFixed(2)}
                </div>
                <div className="text-xs text-ink-500 mt-2">
                  {r.healthy ? "✅ Saludable" : "⚠️ Requiere atención"}
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <div className="label mb-2">Interpretación</div>
            <div className="text-sm text-ink-600 space-y-2">
              <p>Un margen EBITDA saludable en escuelas infantiles es &gt;15%. El ratio de liquidez debe ser &gt;1.5 para garantizar solvencia a corto plazo. El endeudamiento recomendado es &lt;0.5.</p>
              {reporte.margenEbitda < 15 && <p className="text-amber-600">⚠️ El margen EBITDA está por debajo del recomendado. Revisa gastos operativos o ajusta precios.</p>}
              {reporte.liquidez < 1.5 && <p className="text-amber-600">⚠️ La liquidez es baja. Considera reducir plazo de cobro o renegociar pagos a proveedores.</p>}
              {reporte.endeudamiento > 0.5 && <p className="text-amber-600">⚠️ El nivel de endeudamiento es elevado. Evita nuevas deudas hasta reducir la ratio.</p>}
            </div>
          </Card>
          <div className="flex justify-center mt-6">
            <button onClick={() => router.push("/asistente")}
              className="px-6 py-3 rounded-xl bg-coral-50 border border-coral-200 text-coral-600 text-sm font-medium hover:bg-coral-100 transition">
              Preguntar al agente IA sobre estos datos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
