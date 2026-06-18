"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useStore, genId } from "@/lib/data/useStore";
import { eur, fechaCorta } from "@/lib/format";
import { CATEGORIAS_GASTO } from "@/lib/data/catalogos";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus, IconCamera, IconRefresh, IconSearch, IconTrash, IconUpload, IconFile, IconX, IconEdit, IconDownload } from "@/components/ui/Icons";
import { generateModelo303, generateModelo390, generateInformeGestoria } from "@/lib/reports";
import type { Gasto, CategoriaGasto, Recurrencia } from "@/types";

type AsientoManual = { id: string; fecha: string; concepto: string; importe: number; tipo: "ingreso" | "gasto"; categoria: string };

type TabView = "gastos" | "balance" | "asientos" | "informes";

const MESES_CORTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function ContabilidadView() {
  const { gastos, facturas, familias, addGasto, updateGasto, removeGasto, financialStatement, generarAsientosContables, clasificarGasto } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabView>("gastos");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaGasto | "todas">("todas");
  const [sortKey, setSortKey] = useState<"fecha" | "importe">("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState("Escanear factura");
  const [showModal, setShowModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editGastoId, setEditGastoId] = useState<string | null>(null);
  const [ocrFileName, setOcrFileName] = useState<string>("");
  const [ocrData, setOcrData] = useState<{ proveedor: string; fecha: string; importe: number; iva: number; categoria: string; textoExtraido: string; } | null>(null);
  const [asientosManuales, setAsientosManuales] = useState<AsientoManual[]>([]);
  const [showAsientoModal, setShowAsientoModal] = useState(false);
  const [asientoForm, setAsientoForm] = useState({ fecha: new Date().toISOString().split("T")[0], concepto: "", importe: "", tipo: "gasto" as "ingreso" | "gasto", categoria: "otros" });
  const [form, setForm] = useState({ proveedor: "", concepto: "", importe: "", iva: "21", categoria: "otros" as CategoriaGasto, recurrencia: "puntual" as Recurrencia, fecha: new Date().toISOString().split("T")[0], notas: "" });

  const toggleSort = (key: "fecha" | "importe") => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "fecha" ? "desc" : "desc"); }
  };

  const filtrados = useMemo(() => {
    return gastos.filter(g => {
      if (categoriaFiltro !== "todas" && g.categoria !== categoriaFiltro) return false;
      if (busqueda) { const q = busqueda.toLowerCase(); return g.proveedor.toLowerCase().includes(q) || g.concepto.toLowerCase().includes(q); }
      return true;
    }).sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "fecha") return (new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) * dir;
      return (a.importe - b.importe) * dir;
    });
  }, [gastos, categoriaFiltro, busqueda, sortKey, sortDir]);

  const totalMes = useMemo(() => gastos.filter(g => g.fecha.startsWith("2026-06")).reduce((s, g) => s + g.importe, 0), [gastos]);
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastos.forEach(g => map.set(g.categoria, (map.get(g.categoria) || 0) + g.importe));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gastos]);

  const handleFileDrop = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const allowedExts = ["jpg", "jpeg", "png", "webp", "pdf"];
    const mimeOk = allowedMimes.includes(file.type);
    const extOk = allowedExts.includes(ext);
    if (!mimeOk && !extOk) {
      toast("Solo JPG, PNG, WebP y PDF", "error");
      return;
    }
    if (ext === "pdf") {
      // PDF se procesa extrayendo texto
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("Archivo demasiado grande. Máximo 10MB.", "error");
      return;
    }
    setOcrFile(file);
    if (file.type.startsWith("image/") || mimeOk) {
      setOcrPreview(URL.createObjectURL(file));
    } else {
      setOcrPreview(null);
    }
  }, [toast]);

  const getPdfJs = async (): Promise<any> => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    document.head.appendChild(script);
    await new Promise<void>((resolve, reject) => { script.onload = () => resolve(); script.onerror = () => reject(new Error("No se pudo cargar pdf.js desde CDN — revisa tu conexión")); });
    return (window as any).pdfjsLib;
  };

  const convertPdfToPng = async (file: File): Promise<File> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await getPdfJs();
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const scale = Math.min(2, 2000 / page.getViewport({ scale: 1 }).width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error("Canvas toBlob falló")); }, "image/png");
    });
    return new File([pngBlob], file.name.replace(/\.pdf$/i, ".png"), { type: "image/png" });
  };

  const handleOcrUpload = async () => {
    if (!ocrFile) { toast("Selecciona un archivo primero", "error"); return; }
    setOcrLoading(true);
    setOcrStatusText("Procesando...");
    try {
      let fileToSend: File | null = ocrFile;

      if (ocrFile.name.toLowerCase().endsWith(".pdf")) {
        setOcrStatusText("Convirtiendo PDF a imagen...");
        fileToSend = await convertPdfToPng(ocrFile);
      }

      setOcrStatusText("Escaneando con OCR...");
      const formData = new FormData();
      formData.append("file", fileToSend, fileToSend.name);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      let data: any;
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok || !data.success) {
        toast(data.error || `Error ${res.status} — revisa que GOOGLE_VISION_API_KEY esté configurada en Netlify`, "error");
        setOcrLoading(false);
        return;
      }

      const ocr = data.ocr;
      setOcrFileName(ocrFile.name);
      setOcrData({
        proveedor: ocr.proveedor || "",
        fecha: ocr.fecha || "",
        importe: parseFloat(ocr.importe) || 0,
        iva: parseInt(ocr.iva) || 21,
        categoria: ocr.categoria || "otros",
        textoExtraido: ocr.notas || "",
      });
      setForm({
        proveedor: ocr.proveedor || "",
        concepto: ocr.concepto || "",
        importe: ocr.importe?.toString() || "",
        iva: ocr.iva?.toString() || "21",
        categoria: (ocr.categoria as CategoriaGasto) || clasificarGasto(ocr.proveedor || "", ocr.concepto || "") as CategoriaGasto,
        recurrencia: "puntual",
        fecha: ocr.fecha || new Date().toISOString().split("T")[0],
        notas: ocr.notas || "",
      });
      setEditGastoId(null);
      setShowOcrModal(false);
      setOcrFile(null);
      setOcrPreview(null);
      setOcrStatusText("Escanear factura");
      setShowModal(true);
      toast(`OCR completado. Revisa los datos antes de guardar.`);
    } catch (err: any) {
      toast(`Error al conectar con el servidor: ${err?.message || "desconocido"}. Verifica que el sitio esté bien desplegado en Netlify.`, "error");
    }
    setOcrLoading(false);
  };

  const handleSubmit = () => {
    if (!form.proveedor || !form.concepto || !form.importe || !form.fecha) { toast("Completa todos los campos obligatorios", "error"); return; }
    const importeNum = parseFloat(form.importe);
    if (isNaN(importeNum) || importeNum <= 0) { toast("Importe inválido", "error"); return; }
    if (editGastoId) {
      updateGasto(editGastoId, {
        fecha: form.fecha,
        proveedor: form.proveedor,
        concepto: form.concepto,
        importe: importeNum,
        iva: parseInt(form.iva) || 21,
        categoria: form.categoria,
        recurrencia: form.recurrencia,
        notas: form.notas,
      });
      toast(`Gasto actualizado: ${form.proveedor} — ${eur(importeNum)}`);
    } else {
      const newGasto: Gasto = {
        id: genId("gas"),
        fecha: form.fecha,
        proveedor: form.proveedor,
        concepto: form.concepto,
        importe: importeNum,
        iva: parseInt(form.iva) || 21,
        categoria: form.categoria,
        recurrencia: form.recurrencia,
        notas: form.notas,
        ocr: !!ocrFileName,
        archivoOriginal: ocrFileName || undefined,
        ocrRef: ocrData ? { ...ocrData, fechaOCR: new Date().toISOString().slice(0, 10) } : undefined,
      };
      addGasto(newGasto);
      toast(`Gasto registrado: ${form.proveedor} — ${eur(importeNum)}`);
    }
    setShowModal(false);
    setEditGastoId(null);
    setOcrFileName("");
    setOcrData(null);
    setForm({ proveedor: "", concepto: "", importe: "", iva: "21", categoria: "otros", recurrencia: "puntual", fecha: new Date().toISOString().split("T")[0], notas: "" });
  };

  const addAsientoManual = () => {
    if (!asientoForm.concepto || !asientoForm.importe) { toast("Completa concepto e importe", "error"); return; }
    const importe = parseFloat(asientoForm.importe);
    if (isNaN(importe) || importe <= 0) { toast("Importe inválido", "error"); return; }
    const nuevo: AsientoManual = { id: genId("asiento"), fecha: asientoForm.fecha, concepto: asientoForm.concepto, importe, tipo: asientoForm.tipo, categoria: asientoForm.categoria };
    setAsientosManuales(prev => [...prev, nuevo]);
    setShowAsientoModal(false);
    setAsientoForm({ fecha: new Date().toISOString().split("T")[0], concepto: "", importe: "", tipo: "gasto", categoria: "otros" });
    toast("Asiento contable añadido");
  };

  const removeAsientoManual = (id: string) => {
    setAsientosManuales(prev => prev.filter(a => a.id !== id));
    toast("Asiento eliminado");
  };

  const handleEdit = (g: Gasto) => {
    setEditGastoId(g.id);
    setForm({
      proveedor: g.proveedor,
      concepto: g.concepto,
      importe: g.importe.toString(),
      iva: g.iva.toString(),
      categoria: g.categoria,
      recurrencia: g.recurrencia,
      fecha: g.fecha,
      notas: g.notas || "",
    });
    setOcrFileName(g.archivoOriginal || "");
    setShowModal(true);
  };

  const handleDelete = (id: string, proveedor: string) => {
    removeGasto(id);
    toast(`Eliminado: ${proveedor}`, "info");
  };

  const asientos = useMemo(() => {
    const auto = generarAsientosContables();
    const manuales = asientosManuales.map(a => ({ tipo: a.tipo as "ingreso" | "gasto", concepto: a.concepto, importe: a.importe, fecha: a.fecha, categoria: a.categoria }));
    return [...auto, ...manuales].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [gastos, facturas, generarAsientosContables, asientosManuales]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Contabilidad" description="Libro de gastos, balance y asientos contables"
        actions={
          <>
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
              {([["gastos","Gastos"],["balance","Balance"],["asientos","Asientos"],["informes","Informes"]] as [TabView,string][]).map(([k, v]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === k ? "bg-coral-50 text-coral-500 border border-coral-200" : "text-ink-500 hover:text-ink-900"}`}>{v}</button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowOcrModal(true)} disabled={ocrLoading}>
              <IconCamera width={14} height={14} /> {ocrLoading ? "Escaneando..." : "OCR Factura"}
            </Button>
            <Button size="sm" onClick={() => { setEditGastoId(null); setOcrFileName(""); setForm({ proveedor: "", concepto: "", importe: "", iva: "21", categoria: "otros", recurrencia: "puntual", fecha: new Date().toISOString().split("T")[0], notas: "" }); setShowModal(true); }}><IconPlus width={14} height={14} /> Nuevo gasto</Button>
          </>
        }
      />

      <div className="block">
        <div className="card p-4 mb-4 text-sm text-ink-600 border border-coral-200 bg-coral-50">
          📸 Sube una foto de la factura desde <strong>OCR Factura</strong> y el sistema extraerá automáticamente proveedor, importe e IVA.
        </div>
      </div>

      {tab === "gastos" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="label mb-1">Gasto junio</div><div className="text-xl font-bold text-ink-900">{eur(totalMes)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Principal gasto</div><div className="text-xl font-bold text-ink-900">{porCategoria[0]?.[0] ?? "—"}</div></Card>
            <Card className="p-4"><div className="label mb-1">Total acumulado</div><div className="text-xl font-bold text-ink-900">{eur(gastos.reduce((s, g) => s + g.importe, 0))}</div></Card>
            <Card className="p-4"><div className="label mb-1">Gastos/Presupuesto</div><div className="text-xl font-bold text-ink-900">{gastos.length} registros</div></Card>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input !pl-10" placeholder="Buscar proveedor o concepto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <select className="select w-auto" value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value as CategoriaGasto | "todas")}>
              <option value="todas">Todas las categorías</option>
              {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Button variant="ghost" size="sm" onClick={() => { setBusqueda(""); setCategoriaFiltro("todas"); }}><IconRefresh width={14} height={14} /></Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Libro de gastos ({filtrados.length})</CardTitle></CardHeader>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase cursor-pointer select-none hover:text-ink-900 transition" onClick={() => toggleSort("fecha")}>
                        Fecha {sortKey === "fecha" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </th>
                      <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Proveedor</th>
                      <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Concepto</th>
                      <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Categoría</th>
                      <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase cursor-pointer select-none hover:text-ink-900 transition" onClick={() => toggleSort("importe")}>
                        Importe {sortKey === "importe" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </th>
                      <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase">IVA</th>
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase hidden md:table-cell">Archivo</th>
                    <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase hidden md:table-cell">OCR</th>
                    <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase w-14"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(g => (
                    <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-ink-600 text-xs">{fechaCorta(g.fecha)}</td>
                      <td className="py-3 px-3 text-ink-900 font-medium">{g.proveedor}</td>
                      <td className="py-3 px-3 text-ink-700 max-w-[200px] truncate">{g.concepto}</td>
                      <td className="py-3 px-3">
                        <span className={`chip text-[10px] ${CATEGORIAS_GASTO.find(c => c.value === g.categoria)?.color ?? ""}`}>
                          {CATEGORIAS_GASTO.find(c => c.value === g.categoria)?.label ?? g.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-ink-900">{eur(g.importe)}</td>
                      <td className="py-3 px-3 text-center text-ink-500">{g.iva}%</td>
                      <td className="py-3 px-3 text-left text-xs text-ink-400 max-w-[120px] truncate hidden md:table-cell">{g.archivoOriginal || "—"}</td>
                      <td className="py-3 px-3 text-center hidden md:table-cell">{g.ocr ? <span className="text-coral-500 text-xs">📷</span> : <span className="text-ink-400">—</span>}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(g)} className="text-ink-400 hover:text-lapis-500 transition" title="Editar"><IconEdit width={14} height={14} /></button>
                          <button onClick={() => handleDelete(g.id, g.proveedor)} className="text-ink-400 hover:text-red-600 transition" title="Eliminar"><IconTrash width={14} height={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "balance" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5"><div className="label mb-2">Ingresos totales</div><div className="text-2xl font-bold text-emerald-600">{eur(financialStatement.totalIngresos)}</div></Card>
            <Card className="p-5"><div className="label mb-2">Gastos totales</div><div className="text-2xl font-bold text-red-600">{eur(financialStatement.totalGastos)}</div></Card>
            <Card className="p-5"><div className="label mb-2">Resultado neto</div><div className={`text-2xl font-bold ${financialStatement.resultado >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(financialStatement.resultado)}</div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Balance mensual</CardTitle></CardHeader>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60">
                    <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Mes</th>
                    <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Ingresos</th>
                    <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Gastos</th>
                    <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {financialStatement.balanceMensual.map(m => (
                    <tr key={m.mes} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-ink-900 font-medium">{m.mes}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">{eur(m.ingresos)}</td>
                      <td className="py-3 px-3 text-right text-red-600">{eur(m.gastos)}</td>
                      <td className={`py-3 px-3 text-right font-medium ${m.resultado >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(m.resultado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Gastos por categoría</CardTitle></CardHeader>
              <div className="space-y-2">
                {porCategoria.map(([cat, total]) => (
                  <div key={cat} className="flex items-center justify-between py-2 border-b border-gray-200/40 last:border-0">
                    <span className="text-sm text-ink-700 capitalize">{cat}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-coral-400 rounded-full" style={{ width: `${(total / porCategoria[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-ink-900 w-20 text-right">{eur(total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle>Indicadores financieros</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-ink-500">Ratio gastos/ingresos</span><span className="text-ink-900 font-medium">{(financialStatement.ratioGastosIngresos * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Morosos total</span><span className="text-red-600 font-medium">{eur(financialStatement.morososTotal)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Pendiente de cobro</span><span className="text-amber-600 font-medium">{eur(financialStatement.pendienteCobro)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Margen neto</span><span className={financialStatement.totalIngresos > 0 ? "text-emerald-600 font-medium" : "text-ink-500"}>
                  {financialStatement.totalIngresos > 0 ? `${((financialStatement.resultado / financialStatement.totalIngresos) * 100).toFixed(1)}%` : "—"}
                </span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "asientos" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Asientos contables ({asientos.length})</CardTitle>
              <Button size="sm" onClick={() => setShowAsientoModal(true)}><IconPlus width={14} height={14} /> Añadir asiento manual</Button>
            </div>
            <p className="mt-2 text-xs text-ink-400">Los asientos generados automáticamente de facturas y gastos. Puedes añadir asientos manuales para ajustes, amortizaciones, capital inicial, préstamos, etc.</p>
          </CardHeader>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/60">
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Fecha</th>
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Concepto</th>
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Categoría</th>
                  <th className="text-left py-3 px-3 text-ink-500 font-medium text-xs uppercase">Tipo</th>
                  <th className="text-right py-3 px-3 text-ink-500 font-medium text-xs uppercase">Importe</th>
                  <th className="text-center py-3 px-3 text-ink-500 font-medium text-xs uppercase w-10"></th>
                </tr>
              </thead>
              <tbody>
                {asientos.map((a, i) => {
                              return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-ink-600 text-xs">{a.fecha}</td>
                      <td className="py-3 px-3 text-ink-900">{a.concepto}</td>
                      <td className="py-3 px-3">
                        <span className={`chip text-[10px] ${a.categoria === "cuotas" ? "bg-emerald-50 text-emerald-300 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                          {a.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={a.tipo === "ingreso" ? "success" : "warning"}>{a.tipo}</Badge>
                      </td>
                      <td className={`py-3 px-3 text-right font-medium ${a.tipo === "ingreso" ? "text-emerald-600" : "text-red-600"}`}>
                        {a.tipo === "ingreso" ? "+" : "-"}{eur(a.importe)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "informes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => generateModelo303(facturas, gastos, 2, "2026")}
              className="bg-white border-2 border-lapis-100 rounded-2xl p-6 text-left hover:border-lapis-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-lapis-50 flex items-center justify-center mb-3 group-hover:bg-lapis-100 transition-colors">
                <IconDownload width={20} height={20} className="text-lapis-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Modelo 303 — IVA Trimestral</h3>
              <p className="text-xs text-ink-400">Declaración trimestral de IVA. Genera el informe con bases imponibles y cuotas para presentar en Hacienda.</p>
            </button>
            <button
              onClick={() => generateModelo390(facturas, gastos, "2026")}
              className="bg-white border-2 border-lapis-100 rounded-2xl p-6 text-left hover:border-lapis-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-lapis-50 flex items-center justify-center mb-3 group-hover:bg-lapis-100 transition-colors">
                <IconDownload width={20} height={20} className="text-lapis-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Modelo 390 — Resumen Anual</h3>
              <p className="text-xs text-ink-400">Resumen anual de IVA con detalle por trimestres. Incluye totales anuales de IVA repercutido y soportado.</p>
            </button>
            <button
              onClick={() => generateInformeGestoria(facturas, gastos, familias)}
              className="bg-white border-2 border-lapis-100 rounded-2xl p-6 text-left hover:border-lapis-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-lapis-50 flex items-center justify-center mb-3 group-hover:bg-lapis-100 transition-colors">
                <IconDownload width={20} height={20} className="text-lapis-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Informe de Gestoría</h3>
              <p className="text-xs text-ink-400">Informe completo para tu gestor/a con facturación, gastos por categoría, IVA y balance general.</p>
            </button>
          </div>
          <p className="text-xs text-ink-400">Los informes se abren en una nueva ventana. Usa Ctrl+P o el botón de imprimir para guardarlos como PDF.</p>
        </div>
      )}

      {/* Modal añadir gasto */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editGastoId ? "Editar gasto" : "Registrar gasto"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Proveedor <span className="text-coral-500">*</span></label>
            <input className="input w-full" placeholder="Ej: Makro, Endesa, Amazon..." value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Concepto <span className="text-coral-500">*</span></label>
            <input className="input w-full" placeholder="Ej: Compra semanal comedor, Factura luz..." value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Importe (€) <span className="text-coral-500">*</span></label>
              <input className="input w-full" placeholder="0.00" type="number" step="0.01" min="0" value={form.importe} onChange={e => setForm(p => ({ ...p, importe: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">IVA (%)</label>
              <input className="input w-full" placeholder="21" type="number" value={form.iva} onChange={e => setForm(p => ({ ...p, iva: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Fecha del gasto</label>
              <input className="input w-full" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Categoría</label>
              <select className="select w-full" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value as CategoriaGasto }))}>
                {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Recurrencia</label>
            <select className="select w-full" value={form.recurrencia} onChange={e => setForm(p => ({ ...p, recurrencia: e.target.value as Recurrencia }))}>
              <option value="puntual">Puntual — solo una vez</option><option value="mensual">Mensual — se repite cada mes</option><option value="trimestral">Trimestral</option><option value="anual">Anual</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Notas</label>
            <textarea className="input w-full h-20 resize-none" placeholder="Observaciones adicionales (opcional)" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
          </div>
          {editGastoId && (() => { const g = gastos.find(gx => gx.id === editGastoId); return g?.ocrRef ? (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2">Referencia OCR — Auditoría</div>
              <div className="space-y-1 text-xs text-ink-600">
                <div className="flex justify-between"><span>Proveedor detectado</span><span className="text-ink-900 font-medium">{g.ocrRef.proveedor}</span></div>
                <div className="flex justify-between"><span>Importe detectado</span><span className="text-ink-900 font-medium">{g.ocrRef.importe}€</span></div>
                <div className="flex justify-between"><span>IVA detectado</span><span className="text-ink-900 font-medium">{g.ocrRef.iva}%</span></div>
                <div className="flex justify-between"><span>Categoría detectada</span><span className="text-ink-900 font-medium">{g.ocrRef.categoria}</span></div>
                <div className="flex justify-between"><span>Fecha OCR</span><span className="text-ink-900 font-medium">{g.ocrRef.fechaOCR}</span></div>
              </div>
              {g.ocrRef.textoExtraido && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Texto extraído</div>
                  <pre className="text-[10px] text-ink-400 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">{g.ocrRef.textoExtraido}</pre>
                </div>
              )}
            </div>
          ) : g?.archivoOriginal ? (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Archivo original</div>
              <div className="text-xs text-ink-600">{g.archivoOriginal}</div>
            </div>
          ) : null; })()}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit}>Guardar gasto</Button>
        </div>
      </Modal>

      {/* Modal OCR — drag-and-drop */}
      {showOcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowOcrModal(false); setOcrFile(null); setOcrPreview(null); setOcrStatusText("Escanear factura"); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-200 p-6 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink-900">Escanear factura (OCR)</h2>
              <button onClick={() => { setShowOcrModal(false); setOcrFile(null); setOcrPreview(null); setOcrStatusText("Escanear factura"); }} className="text-ink-500 hover:text-ink-900 text-xl leading-none">&times;</button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all text-center ${
                dragOver
                  ? "border-coral-400 bg-coral-50"
                  : ocrFile
                  ? "border-emerald-300 bg-emerald-500/5"
                  : "border-gray-200 bg-gray-50 hover:border-coral-300 hover:bg-gray-50"
              }`}
            >
              {ocrPreview ? (
                <div className="w-full">
                  <img src={ocrPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-ink-600 mt-3">{ocrFile?.name}</p>
                </div>
              ) : ocrFile ? (
                <div className="flex items-center gap-3">
                  <IconFile width={32} height={32} className="text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-ink-900">{ocrFile.name}</p>
                    <p className="text-xs text-ink-500">{(ocrFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <IconUpload width={36} height={36} className="text-ink-400 mb-3" />
                  <p className="text-sm font-medium text-ink-700">Arrastra tu factura aquí</p>
                  <p className="text-xs text-ink-500 mt-1">o haz clic para seleccionar un archivo</p>
                  <p className="text-[10px] text-ink-400 mt-3">JPG · PNG · WebP · PDF (máx 10MB)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={e => handleFileDrop(e.target.files)}
              />
            </div>

            {ocrFile && (
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => { setOcrFile(null); setOcrPreview(null); }} className="flex-1">
                  <IconX width={14} height={14} /> Quitar
                </Button>
                <Button size="sm" onClick={handleOcrUpload} disabled={ocrLoading} className="flex-1">
                  <IconCamera width={14} height={14} /> {ocrLoading ? ocrStatusText : "Escanear factura"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal añadir asiento contable manual */}
      <Modal open={showAsientoModal} onClose={() => setShowAsientoModal(false)} title="Añadir asiento contable manual">
        <p className="text-xs text-ink-400 mb-4">Usa esto para registrar operaciones que no aparecen en facturas ni gastos: amortizaciones, capital inicial, préstamos, subvenciones, donaciones, etc.</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Concepto <span className="text-coral-500">*</span></label>
            <input className="input w-full" placeholder="Ej: Amortización mobiliario, Capital inicial, Préstamo bancario..." value={asientoForm.concepto} onChange={e => setAsientoForm(p => ({ ...p, concepto: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Importe (€) <span className="text-coral-500">*</span></label>
              <input className="input w-full" placeholder="0.00" type="number" step="0.01" min="0" value={asientoForm.importe} onChange={e => setAsientoForm(p => ({ ...p, importe: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Tipo</label>
              <select className="select w-full" value={asientoForm.tipo} onChange={e => setAsientoForm(p => ({ ...p, tipo: e.target.value as "ingreso" | "gasto" }))}>
                <option value="ingreso">Ingreso / Activo</option>
                <option value="gasto">Gasto / Pasivo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Fecha</label>
              <input className="input w-full" type="date" value={asientoForm.fecha} onChange={e => setAsientoForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Categoría</label>
              <select className="select w-full" value={asientoForm.categoria} onChange={e => setAsientoForm(p => ({ ...p, categoria: e.target.value }))}>
                <option value="inmovilizado">Inmovilizado</option>
                <option value="amortizacion">Amortización</option>
                <option value="capital">Capital / Fondos propios</option>
                <option value="prestamo">Préstamo / Deuda</option>
                <option value="subvencion">Subvención</option>
                <option value="tesoreria">Tesorería</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" size="sm" onClick={() => setShowAsientoModal(false)}>Cancelar</Button>
          <Button size="sm" onClick={addAsientoManual}>Añadir asiento</Button>
        </div>
      </Modal>
    </div>
  );
}
