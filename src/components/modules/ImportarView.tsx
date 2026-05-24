"use client";

import { useState, useRef, useCallback } from "react";
import { useStore } from "@/lib/data/useStore";
import { genId } from "@/lib/data/useStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { IconUpload, IconDownload, IconCheck } from "@/components/ui/Icons";
import type { Familia, Factura, Gasto, Empleado } from "@/types";

type EntidadImportable = "familias" | "facturas" | "gastos" | "empleados" | "alumnos" | "leads";

interface Mapeo {
  entidad: EntidadImportable;
  columnas: string[];
  data: any[];
  errores: string[];
}

const PLANTILLAS: Record<EntidadImportable, { label: string; columnas: string[]; ejemplo: string }> = {
  familias: { label: "Familias", columnas: ["nombre", "email", "telefono", "iban", "alumnos"], ejemplo: "Familia García López,ana@email.com,612345678,ES912100...,Martina (3a); Leo (1a)" },
  facturas: { label: "Facturas", columnas: ["familiaId", "periodo", "concepto", "importe", "estado"], ejemplo: "fam-1,Junio 2026,Mensualidad,420,pagada" },
  gastos: { label: "Gastos", columnas: ["fecha", "proveedor", "concepto", "importe", "categoria", "iva"], ejemplo: "2026-06-03,Makro,Pedido semanal,342.80,alimentacion,21" },
  empleados: { label: "Empleados", columnas: ["nombre", "dni", "puesto", "salarioBrutoMensual", "activo"], ejemplo: "María José Fernández,12345678A,Directora,2400,true" },
  alumnos: { label: "Alumnos", columnas: ["nombre", "familiaId", "fechaNac", "curso", "estado"], ejemplo: "Martina García,fam-1,2022-03-15,3 años,activo" },
  leads: { label: "Leads", columnas: ["nombre", "email", "telefono", "fuente", "estado"], ejemplo: "Cliente Potencial,cliente@email.com,612345678,web,nuevo" },
};

function parseCSV(texto: string): string[][] {
  const lineas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  return lineas.map(l => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  });
}

export default function ImportarView() {
  const { familias, facturas, gastos, empleados, alumnos, leads, set } = useStore();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [mapeo, setMapeo] = useState<Mapeo | null>(null);
  const [importado, setImportado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target?.result as string;
      if (!texto) { toast("No se pudo leer el archivo", "error"); return; }
      const filas = parseCSV(texto);
      if (filas.length < 2) { toast("El CSV debe tener cabecera + al menos 1 fila", "error"); return; }
      const cabeceras = filas[0].map(h => h.toLowerCase().trim());
      const datos = filas.slice(1);

      // Auto-detectar entidad
      let entidad: EntidadImportable | null = null;
      for (const [key, plantilla] of Object.entries(PLANTILLAS)) {
        const match = plantilla.columnas.filter(c => cabeceras.includes(c)).length;
        if (match >= 2) { entidad = key as EntidadImportable; break; }
      }
      if (!entidad) {
        toast("No se pudo detectar el tipo de datos. Las columnas deben coincidir con la plantilla.", "error");
        return;
      }

      const plantilla = PLANTILLAS[entidad];
      const data: any[] = [];
      const errores: string[] = [];

      datos.forEach((fila, i) => {
        const obj: any = {};
        let valida = true;
        cabeceras.forEach((col, j) => {
          if (plantilla.columnas.includes(col)) {
            obj[col] = fila[j] || "";
          }
        });
        if (!obj.nombre && !obj.proveedor && !obj.concepto) {
          errores.push(`Fila ${i + 2}: falta campo obligatorio`);
          valida = false;
        }
        if (valida) {
          obj.id = genId(entidad!.slice(0, 3));
          if (entidad === "gastos") {
            obj.iva = parseFloat(obj.iva) || 21;
            obj.importe = parseFloat(obj.importe) || 0;
            obj.categoria = obj.categoria || "otros";
            obj.recurrencia = "puntual";
          }
          if (entidad === "facturas") {
            obj.total = parseFloat(obj.importe) || 0;
            obj.numero = `IMP-${Date.now()}-${i}`;
            obj.items = [{ concepto: obj.concepto || "", importe: obj.total }];
            obj.diasImpago = obj.estado === "impago" ? 30 : 0;
          }
          if (entidad === "empleados") {
            obj.salarioBrutoMensual = parseFloat(obj.salarioBrutoMensual) || 0;
            obj.activo = obj.activo === "true" || obj.activo === "1";
            obj.horasSemanales = 40;
            obj.fechaAlta = new Date().toISOString().split("T")[0];
            obj.iban = obj.iban || "";
          }
          if (entidad === "alumnos") {
            obj.edad = "";
            obj.fechaIngreso = new Date().toISOString().split("T")[0];
            obj.alergias = [];
            obj.vacunas = [];
            obj.contactosEmergencia = [];
            obj.autorizadosRecogida = [];
            obj.documentos = [];
            obj.autorizacionImagen = false;
          }
          if (entidad === "leads") {
            obj.fechaContacto = new Date().toISOString().split("T")[0];
          }
          data.push(obj);
        }
      });

      setMapeo({ entidad, columnas: cabeceras, data, errores });
      setImportado(false);
    };
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".tsv"))) handleFile(file);
    else toast("Solo archivos .csv o .tsv", "error");
  }, [handleFile, toast]);

  const handleImportar = () => {
    if (!mapeo || mapeo.data.length === 0) return;
    const { entidad, data } = mapeo;
    const actual = { familias, facturas, gastos, empleados, alumnos, leads };
    const combinado = [...(actual[entidad] as any[]), ...data];
    set(entidad, combinado as any);
    setImportado(true);
    toast(`${data.length} registros importados a ${PLANTILLAS[entidad].label}`);
  };

  const descargarPlantilla = (entidad: EntidadImportable) => {
    const p = PLANTILLAS[entidad];
    const cabecera = p.columnas.join(",");
    const csv = `\uFEFF${cabecera}\n${p.ejemplo}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `plantilla-${entidad}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Importar datos" description="Sube un archivo CSV con los datos de tu escuela para migrarlos a Nido" />

      {!mapeo && (
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(PLANTILLAS).map(([key, p]) => (
            <Card key={key} className="p-5">
              <CardTitle className="mb-2 text-sm">{p.label}</CardTitle>
              <div className="text-[10px] text-ink-400 mb-3 font-mono">{p.columnas.join(", ")}</div>
              <Button variant="ghost" size="sm" onClick={() => descargarPlantilla(key as EntidadImportable)}>
                  <IconDownload width={16} height={16} /> Plantilla CSV
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !mapeo && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all text-center ${
          dragOver ? "border-coral-400 bg-coral-500/10" : mapeo ? "border-emerald-400/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-coral-500/30"
        }`}
      >
        {mapeo ? (
          <div className="text-center">
            <IconCheck width={40} height={40} className="mx-auto text-emerald-400 mb-3" />
            <p className="text-sm font-medium text-emerald-900">{mapeo.data.length} registros detectados</p>
            <p className="text-xs text-emerald-700 mt-1">{PLANTILLAS[mapeo.entidad].label}</p>
            {mapeo.errores.length > 0 && (
              <div className="mt-3 text-xs text-red-400">{mapeo.errores.length} errores de validación</div>
            )}
          </div>
        ) : (
          <>
            <IconUpload width={40} height={40} className="text-ink-300 mb-3" />
            <p className="text-sm font-medium text-ink-500">Arrastra tu archivo CSV aquí</p>
            <p className="text-xs text-ink-400 mt-1">o haz clic para seleccionar</p>
          </>
        )}
        <input ref={fileInputRef} type="file" accept=".csv,.tsv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {mapeo && !importado && (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => { setMapeo(null); }}>Cancelar</Button>
          <Button size="sm" onClick={handleImportar} disabled={mapeo.data.length === 0}>
            Importar {mapeo.data.length} registros
          </Button>
        </div>
      )}

      {mapeo && (
        <Card>
          <CardHeader><CardTitle>Vista previa ({mapeo.data.length} filas)</CardTitle></CardHeader>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {mapeo.columnas.map(c => <th key={c} className="text-left py-2 px-3 text-ink-500 font-medium text-xs uppercase">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {mapeo.data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-gray-200/60">
                    {mapeo.columnas.map(c => <td key={c} className="py-2 px-3 text-ink-600 text-xs truncate max-w-[150px]">{String(row[c] || "")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {importado && (
        <Card className="p-8 text-center border-emerald-500/20 bg-emerald-500/5">
          <IconCheck width={48} height={48} className="mx-auto text-emerald-400 mb-3" />
          <h3 className="text-lg font-bold text-emerald-900 mb-1">Importación completada</h3>
          <p className="text-sm text-emerald-700">Los datos ya están disponibles en la aplicación.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => { setMapeo(null); setImportado(false); }}>Importar otro archivo</Button>
        </Card>
      )}
    </div>
  );
}
