"use client";

import { useStore } from "@/lib/data/useStore";
import { PageHeader } from "@/components/PageHeader";
import { IconDownload, IconFile } from "@/components/ui/Icons";
import {
  exportFamiliasCSV, exportFacturasCSV, exportGastosCSV,
  exportAlumnosCSV, exportLeadsCSV, exportEmpleadosCSV,
} from "@/lib/export/csv";
import {
  exportFamiliasExcel, exportFacturasExcel, exportGastosExcel,
  exportAlumnosExcel, exportLeadsExcel, exportEmpleadosExcel,
} from "@/lib/export/excel";
import { generateModelo303, generateModelo390, generateInformeGestoria } from "@/lib/reports";

type ExportItem = {
  label: string;
  desc: string;
  action: () => void;
  count: number;
};

type ReportItem = {
  label: string;
  desc: string;
  action: () => void;
};

export default function ExportacionView() {
  const { familias, facturas, gastos, empleados, alumnos, leads } = useStore();

  const dataItems: ExportItem[][] = [
    [
      { label: "Familias", desc: "Datos de contacto e IBAN", action: () => exportFamiliasCSV(familias), count: familias.length },
      { label: "Facturas", desc: "Todas las facturas emitidas", action: () => exportFacturasCSV(facturas), count: facturas.length },
      { label: "Gastos", desc: "Gastos registrados por categoría", action: () => exportGastosCSV(gastos), count: gastos.length },
    ],
    [
      { label: "Alumnos", desc: "Perfiles de estudiantes", action: () => exportAlumnosCSV(alumnos.map(a => ({
        id: a.id, nombre: a.nombre, fechaNac: a.fechaNac, curso: a.curso, estado: a.estado,
        alergias: a.alergias.map(al => al.desencadenante).join("; "),
      }))), count: alumnos.length },
      { label: "Leads", desc: "Oportunidades comerciales", action: () => exportLeadsCSV(leads), count: leads.length },
      { label: "Empleados", desc: "Plantilla y salarios", action: () => exportEmpleadosCSV(empleados), count: empleados.length },
    ],
  ];

  const reportItems: ReportItem[] = [
    {
      label: "Modelo 303 — IVA Trimestral",
      desc: "Declaración trimestral de IVA. Base imponible, cuotas repercutidas y soportadas.",
      action: () => generateModelo303(facturas, gastos, 2, "2026"),
    },
    {
      label: "Modelo 390 — Resumen Anual IVA",
      desc: "Resumen anual de IVA con detalle por trimestres. Para presentación en Hacienda.",
      action: () => generateModelo390(facturas, gastos, "2026"),
    },
    {
      label: "Informe de Gestoría",
      desc: "Informe completo para tu gestor/a: facturación, gastos, IVA y balances.",
      action: () => generateInformeGestoria(facturas, gastos, familias),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Exportar datos" description="Descarga tus datos en CSV o genera informes para tu gestoría" />

      {/* Reportes / Informes */}
      <div>
        <h3 className="text-sm font-semibold text-ink-600 uppercase tracking-wider mb-3">Informes para gestoría</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportItems.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="bg-white border-2 border-lapis-100 rounded-2xl p-5 text-left hover:border-lapis-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-lapis-50 flex items-center justify-center group-hover:bg-lapis-100 transition-colors">
                  <IconFile width={20} height={20} className="text-lapis-500" />
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.label}</h3>
              <p className="text-xs text-ink-400">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Datos CSV / Excel */}
      <div>
        <h3 className="text-sm font-semibold text-ink-600 uppercase tracking-wider mb-3">Datos exportables</h3>
        {dataItems.map((row, ri) => (
          <div key={ri} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {row.map(item => {
              const excelAction = item.label === "Familias" ? () => exportFamiliasExcel(familias)
                : item.label === "Facturas" ? () => exportFacturasExcel(facturas)
                : item.label === "Gastos" ? () => exportGastosExcel(gastos)
                : item.label === "Alumnos" ? () => exportAlumnosExcel(alumnos.map(a => ({ ...a, alergias: a.alergias.map(al => al.desencadenante).join("; ") })))
                : item.label === "Leads" ? () => exportLeadsExcel(leads)
                : item.label === "Empleados" ? () => exportEmpleadosExcel(empleados)
                : () => {};
              return (
                <div key={item.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center">
                      <IconDownload width={20} height={20} className="text-coral-500" />
                    </div>
                    <span className="text-xs text-ink-400">{item.count} registros</span>
                  </div>
                  <h3 className="font-semibold mb-1">{item.label}</h3>
                  <p className="text-xs text-ink-400 mb-3">{item.desc}</p>
                  <div className="flex gap-2">
                    <button onClick={item.action} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors">
                      CSV
                    </button>
                    <button onClick={excelAction} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors">
                      Excel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Backup JSON */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-2">Copia de seguridad (JSON)</h3>
        <p className="text-xs text-ink-400 mb-3">Descarga una copia de seguridad completa en formato JSON con todos los datos del centro.</p>
        <button
          onClick={() => {
            const backup = { familias, facturas, gastos, empleados, alumnos, leads };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `nido-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 transition-colors"
        >
          Descargar backup JSON
        </button>
      </div>
    </div>
  );
}
