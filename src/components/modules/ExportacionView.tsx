"use client";

import { useStore } from "@/lib/data/useStore";
import { IconDownload } from "@/components/ui/Icons";
import {
  exportFamiliasCSV, exportFacturasCSV, exportGastosCSV,
  exportAlumnosCSV, exportLeadsCSV, exportEmpleadosCSV,
} from "@/lib/export/csv";

type ExportItem = {
  label: string;
  desc: string;
  action: () => void;
  count: number;
};

export default function ExportacionView() {
  const { familias, facturas, gastos, empleados, alumnos, leads } = useStore();

  const items: ExportItem[][] = [
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Exportar datos</h2>
        <p className="text-sm text-charcoal-400">Descarga tus datos en formato CSV compatible con Excel y Google Sheets</p>
      </div>

      {items.map((row, ri) => (
        <div key={ri} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {row.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="bg-charcoal-800/30 border border-charcoal-700/50 rounded-2xl p-5 text-left hover:border-coral-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-coral-500/20 flex items-center justify-center group-hover:bg-coral-500/30 transition-colors">
                  <IconDownload className="text-coral-400" />
                </div>
                <span className="text-xs text-charcoal-500">{item.count} registros</span>
              </div>
              <h3 className="font-semibold mb-1">{item.label}</h3>
              <p className="text-sm text-charcoal-400">{item.desc}</p>
            </button>
          ))}
        </div>
      ))}

      <div className="bg-charcoal-800/20 border border-charcoal-700/50 rounded-2xl p-5">
        <h3 className="font-semibold mb-2">Exportación completa (JSON)</h3>
        <p className="text-sm text-charcoal-400 mb-3">Descarga una copia de seguridad completa en formato JSON con todos los datos.</p>
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
          className="px-4 py-2 bg-charcoal-700/50 rounded-xl text-sm hover:bg-charcoal-700 transition-colors"
        >
          Descargar backup JSON
        </button>
      </div>
    </div>
  );
}
