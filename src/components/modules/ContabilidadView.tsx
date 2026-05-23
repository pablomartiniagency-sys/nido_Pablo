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
import { IconPlus, IconCamera, IconRefresh, IconSearch, IconTrash, IconUpload, IconFile, IconX } from "@/components/ui/Icons";
import type { Gasto, CategoriaGasto, Recurrencia } from "@/types";

type TabView = "gastos" | "balance" | "asientos";

const MESES_CORTO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function ContabilidadView() {
  const { gastos, facturas, addGasto, removeGasto, financialStatement, generarAsientosContables, clasificarGasto } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabView>("gastos");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaGasto | "todas">("todas");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState("Escanear factura");
  const [showModal, setShowModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ proveedor: "", concepto: "", importe: "", iva: "21", categoria: "otros" as CategoriaGasto, recurrencia: "puntual" as Recurrencia, fecha: new Date().toISOString().split("T")[0], notas: "" });

  const filtrados = useMemo(() => {
    return gastos.filter(g => {
      if (categoriaFiltro !== "todas" && g.categoria !== categoriaFiltro) return false;
      if (busqueda) { const q = busqueda.toLowerCase(); return g.proveedor.toLowerCase().includes(q) || g.concepto.toLowerCase().includes(q); }
      return true;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [gastos, categoriaFiltro, busqueda]);

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

  const convertPdfToPng = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const scale = Math.min(2, 2000 / page.getViewport({ scale: 1 }).width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => { if (b) resolve(b); else reject(new Error("Canvas toBlob falló")); }, "image/png");
    });
  };

  const handleOcrUpload = async () => {
    if (!ocrFile) { toast("Selecciona un archivo primero", "error"); return; }
    setOcrLoading(true);
    setOcrStatusText("Procesando...");
    try {
      const ext = ocrFile.name.split(".").pop()?.toLowerCase() || "";
      let fileToSend: File | Blob = ocrFile;
      let fileName = ocrFile.name;

      if (ext === "pdf") {
        setOcrStatusText("Convirtiendo PDF a imagen...");
        const pngBlob = await convertPdfToPng(ocrFile);
        fileToSend = pngBlob;
        fileName = ocrFile.name.replace(/\.pdf$/i, ".png");
      }

      setOcrStatusText("Escaneando con OCR...");
      const formData = new FormData();
      formData.append("file", fileToSend, fileName);

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
      setForm({
        proveedor: ocr.proveedor || "",
        concepto: ocr.concepto || "",
        importe: ocr.importe?.toString() || "",
        iva: ocr.iva?.toString() || "21",
        categoria: clasificarGasto(ocr.proveedor || "", ocr.concepto || "") as CategoriaGasto,
        recurrencia: "puntual",
        fecha: new Date().toISOString().split("T")[0],
        notas: ocr.notas || "",
      });
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
      ocr: true,
    };
    addGasto(newGasto);
    toast(`Gasto registrado: ${form.proveedor} — ${eur(importeNum)}`);
    setShowModal(false);
    setForm({ proveedor: "", concepto: "", importe: "", iva: "21", categoria: "otros", recurrencia: "puntual", fecha: new Date().toISOString().split("T")[0], notas: "" });
  };

  const handleDelete = (id: string, proveedor: string) => {
    removeGasto(id);
    toast(`Eliminado: ${proveedor}`, "info");
  };

  const asientos = useMemo(() => generarAsientosContables(), [gastos, facturas, generarAsientosContables]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Contabilidad" description="Libro de gastos, balance y asientos contables"
        actions={
          <>
            <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
              {([["gastos","Gastos"],["balance","Balance"],["asientos","Asientos"]] as [TabView,string][]).map(([k, v]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === k ? "bg-coral-500/20 text-coral-300 border border-coral-500/30" : "text-white/50 hover:text-white"}`}>{v}</button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowOcrModal(true)} disabled={ocrLoading}>
              <IconCamera width={14} height={14} /> {ocrLoading ? "Escaneando..." : "OCR Factura"}
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)}><IconPlus width={14} height={14} /> Nuevo gasto</Button>
          </>
        }
      />

      <div className="block">
        <div className="card p-4 mb-4 text-sm text-white/60 border border-coral-500/20 bg-coral-500/5">
          📸 Sube una foto de la factura desde <strong>OCR Factura</strong> y el sistema extraerá automáticamente proveedor, importe e IVA.
        </div>
      </div>

      {tab === "gastos" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="label mb-1">Gasto junio</div><div className="text-xl font-bold text-white">{eur(totalMes)}</div></Card>
            <Card className="p-4"><div className="label mb-1">Principal gasto</div><div className="text-xl font-bold text-white">{porCategoria[0]?.[0] ?? "—"}</div></Card>
            <Card className="p-4"><div className="label mb-1">Total acumulado</div><div className="text-xl font-bold text-white">{eur(gastos.reduce((s, g) => s + g.importe, 0))}</div></Card>
            <Card className="p-4"><div className="label mb-1">Gastos/Presupuesto</div><div className="text-xl font-bold text-white">{gastos.length} registros</div></Card>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input className="input pl-9" placeholder="Buscar proveedor o concepto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
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
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Fecha</th>
                    <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Proveedor</th>
                    <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Concepto</th>
                    <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Categoría</th>
                    <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Importe</th>
                    <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase">IVA</th>
                    <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase">OCR</th>
                    <th className="text-center py-3 px-3 text-white/40 font-medium text-xs uppercase w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(g => (
                    <tr key={g.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-white/60 text-xs">{fechaCorta(g.fecha)}</td>
                      <td className="py-3 px-3 text-white font-medium">{g.proveedor}</td>
                      <td className="py-3 px-3 text-white/70 max-w-[200px] truncate">{g.concepto}</td>
                      <td className="py-3 px-3">
                        <span className={`chip text-[10px] ${CATEGORIAS_GASTO.find(c => c.value === g.categoria)?.color ?? ""}`}>
                          {CATEGORIAS_GASTO.find(c => c.value === g.categoria)?.label ?? g.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-white">{eur(g.importe)}</td>
                      <td className="py-3 px-3 text-center text-white/40">{g.iva}%</td>
                      <td className="py-3 px-3 text-center">{g.ocr ? <span className="text-coral-400 text-xs">📷</span> : <span className="text-white/20">—</span>}</td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => handleDelete(g.id, g.proveedor)} className="text-white/20 hover:text-red-400 transition"><IconTrash width={14} height={14} /></button>
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
            <Card className="p-5"><div className="label mb-2">Ingresos totales</div><div className="text-2xl font-bold text-emerald-400">{eur(financialStatement.totalIngresos)}</div></Card>
            <Card className="p-5"><div className="label mb-2">Gastos totales</div><div className="text-2xl font-bold text-red-400">{eur(financialStatement.totalGastos)}</div></Card>
            <Card className="p-5"><div className="label mb-2">Resultado neto</div><div className={`text-2xl font-bold ${financialStatement.resultado >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(financialStatement.resultado)}</div></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Balance mensual</CardTitle></CardHeader>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Mes</th>
                    <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Ingresos</th>
                    <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Gastos</th>
                    <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {financialStatement.balanceMensual.map(m => (
                    <tr key={m.mes} className="border-b border-white/[0.03]">
                      <td className="py-3 px-3 text-white font-medium">{m.mes}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{eur(m.ingresos)}</td>
                      <td className="py-3 px-3 text-right text-red-400">{eur(m.gastos)}</td>
                      <td className={`py-3 px-3 text-right font-medium ${m.resultado >= 0 ? "text-emerald-400" : "text-red-400"}`}>{eur(m.resultado)}</td>
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
                  <div key={cat} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm text-white/70 capitalize">{cat}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-coral-400 rounded-full" style={{ width: `${(total / porCategoria[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-white w-20 text-right">{eur(total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle>Indicadores financieros</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-white/50">Ratio gastos/ingresos</span><span className="text-white font-medium">{(financialStatement.ratioGastosIngresos * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-white/50">Morosos total</span><span className="text-red-400 font-medium">{eur(financialStatement.morososTotal)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Pendiente de cobro</span><span className="text-amber-400 font-medium">{eur(financialStatement.pendienteCobro)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Margen neto</span><span className={financialStatement.totalIngresos > 0 ? "text-emerald-400 font-medium" : "text-white/50"}>
                  {financialStatement.totalIngresos > 0 ? `${((financialStatement.resultado / financialStatement.totalIngresos) * 100).toFixed(1)}%` : "—"}
                </span></div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "asientos" && (
        <Card>
          <CardHeader><CardTitle>Asientos contables ({asientos.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Fecha</th>
                  <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Concepto</th>
                  <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Categoría</th>
                  <th className="text-left py-3 px-3 text-white/40 font-medium text-xs uppercase">Tipo</th>
                  <th className="text-right py-3 px-3 text-white/40 font-medium text-xs uppercase">Importe</th>
                </tr>
              </thead>
              <tbody>
                {asientos.map((a, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="py-3 px-3 text-white/60 text-xs">{a.fecha}</td>
                    <td className="py-3 px-3 text-white">{a.concepto}</td>
                    <td className="py-3 px-3">
                      <span className={`chip text-[10px] ${a.categoria === "cuotas" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}`}>
                        {a.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={a.tipo === "ingreso" ? "success" : "warning"}>{a.tipo}</Badge>
                    </td>
                    <td className={`py-3 px-3 text-right font-medium ${a.tipo === "ingreso" ? "text-emerald-400" : "text-red-400"}`}>
                      {a.tipo === "ingreso" ? "+" : "-"}{eur(a.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal añadir gasto */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar gasto">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">Proveedor <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: Makro, Endesa, Amazon..." value={form.proveedor} onChange={e => setForm(p => ({ ...p, proveedor: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">Concepto <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: Compra semanal comedor, Factura luz..." value={form.concepto} onChange={e => setForm(p => ({ ...p, concepto: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Importe (€) <span className="text-coral-400">*</span></label>
              <input className="input w-full" placeholder="0.00" type="number" step="0.01" min="0" value={form.importe} onChange={e => setForm(p => ({ ...p, importe: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">IVA (%)</label>
              <input className="input w-full" placeholder="21" type="number" value={form.iva} onChange={e => setForm(p => ({ ...p, iva: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Fecha del gasto</label>
              <input className="input w-full" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-charcoal-300">Categoría</label>
              <select className="select w-full" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value as CategoriaGasto }))}>
                {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">Recurrencia</label>
            <select className="select w-full" value={form.recurrencia} onChange={e => setForm(p => ({ ...p, recurrencia: e.target.value as Recurrencia }))}>
              <option value="puntual">Puntual — solo una vez</option><option value="mensual">Mensual — se repite cada mes</option><option value="trimestral">Trimestral</option><option value="anual">Anual</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-charcoal-300">Notas</label>
            <textarea className="input w-full h-20 resize-none" placeholder="Observaciones adicionales (opcional)" value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
          </div>
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
          <div className="relative w-full max-w-lg rounded-2xl bg-ink-700 border border-white/10 p-6 shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Escanear factura (OCR)</h2>
              <button onClick={() => { setShowOcrModal(false); setOcrFile(null); setOcrPreview(null); setOcrStatusText("Escanear factura"); }} className="text-white/40 hover:text-white text-xl leading-none">&times;</button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all text-center ${
                dragOver
                  ? "border-coral-400 bg-coral-500/10"
                  : ocrFile
                  ? "border-emerald-400/50 bg-emerald-500/5"
                  : "border-white/10 bg-white/[0.02] hover:border-coral-500/30 hover:bg-white/[0.04]"
              }`}
            >
              {ocrPreview ? (
                <div className="w-full">
                  <img src={ocrPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-white/60 mt-3">{ocrFile?.name}</p>
                </div>
              ) : ocrFile ? (
                <div className="flex items-center gap-3">
                  <IconFile width={32} height={32} className="text-emerald-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{ocrFile.name}</p>
                    <p className="text-xs text-white/40">{(ocrFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <IconUpload width={36} height={36} className="text-white/30 mb-3" />
                  <p className="text-sm font-medium text-white/70">Arrastra tu factura aquí</p>
                  <p className="text-xs text-white/40 mt-1">o haz clic para seleccionar un archivo</p>
                  <p className="text-[10px] text-white/30 mt-3">JPG · PNG · WebP · PDF (máx 10MB)</p>
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
    </div>
  );
}
