"use client";

import { useState, useMemo } from "react";
import { useStore, genId } from "@/lib/data/useStore";
import { eur } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { IconPlus, IconSearch, IconTrash, IconFile, IconCheck } from "@/components/ui/Icons";
import Link from "next/link";
import { SERVICIOS_CATALOGO } from "@/lib/data/catalogos";
import type { Familia, Servicio, CargoPendiente } from "@/types";

const SERVICIO_OTRO = { concepto: "__otro__", importe: 0, descripcion: "Otro concepto personalizado" };

const GRUPOS_SERVICIOS: Array<{ label: string; filtro: (c: typeof SERVICIOS_CATALOGO[number]) => boolean }> = [
  { label: "Mensualidades", filtro: c => c.concepto.startsWith("Mensualidad") || c.concepto.startsWith("Lactantes") || c.concepto === "Matrícula curso escolar" },
  { label: "Comedor y horarios", filtro: c => c.concepto.includes("Comedor") || c.concepto.includes("Ampliación") },
  { label: "Extraescolares", filtro: c => c.concepto.includes("Extraescolar") },
  { label: "Complementos", filtro: c => !c.concepto.startsWith("Mensualidad") && !c.concepto.startsWith("Lactantes") && c.concepto !== "Matrícula curso escolar" && !c.concepto.includes("Comedor") && !c.concepto.includes("Ampliación") && !c.concepto.includes("Extraescolar") },
];

function esCatalogo(concepto: string) {
  return SERVICIOS_CATALOGO.some(c => c.concepto === concepto);
}

export function FamiliasView() {
  const { familias, facturas, cargosPendientes, addFamilia, updateFamilia, removeFamilia, addCargo, updateCargo, removeCargo } = useStore();
  const { toast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", iban: "", alumnos: [] as { nombre: string; edad: string }[], servicios: [] as Servicio[] });
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [cargoFamiliaId, setCargoFamiliaId] = useState<string | null>(null);
  const [cargoForm, setCargoForm] = useState({ alumnoNombre: "", concepto: "", importe: "", tipo: "cuota" as CargoPendiente["tipo"], fechaVencimiento: "", notas: "" });

  const filtradas = useMemo(() => {
    if (!busqueda) return familias;
    const q = busqueda.toLowerCase();
    return familias.filter(f => f.nombre.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.alumnos.some(a => a.toLowerCase().includes(q)));
  }, [familias, busqueda]);

  const getCargosFamilia = (familiaId: string) => {
    const cargos = cargosPendientes.filter(c => c.familiaId === familiaId);
    const pendiente = cargos.filter(c => c.estado === "pendiente").reduce((s, c) => s + c.importe, 0);
    const vencidos = cargos.filter(c => c.estado === "pendiente" && c.fechaVencimiento < new Date().toISOString().slice(0, 10));
    return { cargos, totalPendiente: pendiente, vencidosCount: vencidos.length };
  };

  const handleAddCargo = () => {
    if (!cargoFamiliaId || !cargoForm.alumnoNombre || !cargoForm.concepto || !cargoForm.importe) {
      toast("Completa los campos obligatorios", "error"); return;
    }
    const familia = familias.find(f => f.id === cargoFamiliaId);
    if (!familia) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const cargo: CargoPendiente = {
      id: genId("cargo"),
      familiaId: cargoFamiliaId,
      alumnoId: "",
      alumnoNombre: cargoForm.alumnoNombre,
      concepto: cargoForm.concepto,
      importe: parseFloat(cargoForm.importe),
      fechaEmision: hoy,
      fechaVencimiento: cargoForm.fechaVencimiento || hoy,
      estado: "pendiente",
      tipo: cargoForm.tipo,
      notas: cargoForm.notas || undefined,
    };
    addCargo(cargo);
    toast(`Cargo de ${eur(cargo.importe)} añadido a ${cargo.alumnoNombre}`);
    setShowCargoModal(false);
    setCargoForm({ alumnoNombre: "", concepto: "", importe: "", tipo: "cuota", fechaVencimiento: "", notas: "" });
  };

  const getBillingStatus = (familiaId: string) => {
    const facturasFamilia = facturas.filter(f => f.familiaId === familiaId);
    const pagado = facturasFamilia.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
    const pendiente = facturasFamilia.filter(f => f.estado === "enviada").reduce((s, f) => s + f.total, 0);
    const impagado = facturasFamilia.filter(f => f.estado === "impago").reduce((s, f) => s + f.total, 0);
    const totalFacturado = facturasFamilia.reduce((s, f) => s + f.total, 0);
    return { pagado, pendiente, impagado, totalFacturado, deudaTotal: pendiente + impagado };
  };

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: "", email: "", telefono: "", iban: "", alumnos: [], servicios: [] });
    setShowModal(true);
  };

  const openEdit = (f: Familia) => {
    setEditId(f.id);
    setForm({
      nombre: f.nombre, email: f.email, telefono: f.telefono, iban: f.iban,
      alumnos: f.alumnos.map(a => {
        const m = a.match(/^(.+?)\s*\((\d+\s*año[s]?)\)$/);
        return m ? { nombre: m[1].trim(), edad: m[2] } : { nombre: a, edad: "" };
      }),
      servicios: [...f.servicios],
    });
    setShowModal(true);
  };

  const addAlumnoItem = () => setForm(p => ({ ...p, alumnos: [...p.alumnos, { nombre: "", edad: "" }] }));
  const removeAlumnoItem = (i: number) => setForm(p => ({ ...p, alumnos: p.alumnos.filter((_, idx) => idx !== i) }));

  const addServicioItem = () => setForm(p => ({ ...p, servicios: [...p.servicios, { concepto: "", importe: 0 }] }));
  const removeServicioItem = (i: number) => setForm(p => ({ ...p, servicios: p.servicios.filter((_, idx) => idx !== i) }));

  const setServicioConcepto = (i: number, valor: string) => {
    setForm(p => {
      const s2 = [...p.servicios];
      if (valor === "__otro__") {
        s2[i] = { concepto: "", importe: 0 };
      } else {
        const cat = [...SERVICIOS_CATALOGO, SERVICIO_OTRO].find(c => c.concepto === valor);
        s2[i] = { concepto: cat?.concepto || valor, importe: cat?.importe || 0 };
      }
      return { ...p, servicios: s2 };
    });
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.email) { toast("Nombre y email requeridos", "error"); return; }
    const alumnos = form.alumnos.filter(a => a.nombre).map(a => a.edad ? `${a.nombre} (${a.edad})` : a.nombre);
    const servicios = form.servicios.filter(s => s.concepto && s.importe > 0);
    if (editId) {
      updateFamilia(editId, { nombre: form.nombre, email: form.email, telefono: form.telefono, iban: form.iban, alumnos, servicios });
      toast("Familia actualizada");
    } else {
      const newF: Familia = { id: genId("fam"), nombre: form.nombre, email: form.email, telefono: form.telefono, iban: form.iban, alumnos, servicios };
      addFamilia(newF);
      toast("Familia añadida");
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader title="Familias — CRM" description={`${familias.length} familias · ${familias.reduce((s, f) => s + f.alumnos.length, 0)} alumnos`}
        actions={<Button size="sm" onClick={openNew}><IconPlus width={14} height={14} /> Nueva familia</Button>}
      />

      <div className="relative max-w-md">
        <IconSearch width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-10" placeholder="Buscar familia o alumno..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtradas.map(f => (
          <Card key={f.id} hover className="cursor-pointer" onClick={() => openEdit(f)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-ink-900">{f.nombre}</h3>
                <p className="text-xs text-ink-500">{f.email} · {f.telefono}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {(() => { const bs = getBillingStatus(f.id); const cs = getCargosFamilia(f.id); return (
                  <>
                    <Badge variant="success">Cobrado: {eur(bs.pagado)}</Badge>
                    {bs.pendiente > 0 && <Badge variant="info">{eur(bs.pendiente)} pendiente</Badge>}
                    {bs.impagado > 0 && <Badge variant="danger">{eur(bs.impagado)} impagado</Badge>}
                    {cs.totalPendiente > 0 && (
                      <Badge variant={cs.vencidosCount > 0 ? "danger" : "warning"}>
                        Cargos: {eur(cs.totalPendiente)}{cs.vencidosCount > 0 ? ` (${cs.vencidosCount} venc.)` : ""}
                      </Badge>
                    )}
                  </>
                ); })()}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {f.alumnos.map((a, i) => {
                const m = a.match(/^(.+?)\s*\((\d+\s*año[s]?)\)$/);
                const nombre = m ? m[1].trim() : a;
                const edad = m ? m[2] : "";
                const cs = getCargosFamilia(f.id);
                const cargosAlumno = cs.cargos.filter(c => c.estado === "pendiente" && c.alumnoNombre === a);
                return (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
                    <span className="text-xs font-medium text-ink-900">{nombre}</span>
                    {edad && <span className="text-[10px] text-ink-400">{edad}</span>}
                    {cargosAlumno.length > 0 && (
                      <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${cargosAlumno.some(c => c.fechaVencimiento < new Date().toISOString().slice(0, 10)) ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                        {cargosAlumno.length} cargo{cargosAlumno.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setCargoFamiliaId(f.id); setCargoForm(p => ({ ...p, alumnoNombre: a })); setShowCargoModal(true); }}
                      className="text-[10px] text-coral-400 hover:text-coral-500 ml-0.5" title="Añadir cargo a este alumno">+</button>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-ink-400 truncate font-mono">IBAN: {f.iban}</div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Servicios contratados</div>
              {f.servicios.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-ink-600">{s.concepto}</span>
                  <span className="text-ink-900 font-medium">{eur(s.importe)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              {(() => { const cs = getCargosFamilia(f.id); if (cs.cargos.length === 0) return null;
                const pendientes = cs.cargos.filter(c => c.estado === "pendiente");
                const grouped = pendientes.reduce((acc, c) => {
                  if (!acc[c.alumnoNombre]) acc[c.alumnoNombre] = [];
                  acc[c.alumnoNombre].push(c);
                  return acc;
                }, {} as Record<string, typeof pendientes>);
                return (
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-1">Cargos pendientes por alumno</div>
                  {Object.entries(grouped).map(([alumno, cargos]) => (
                    <div key={alumno} className="mb-2">
                      <div className="text-xs font-semibold text-ink-700 mb-1">{alumno}</div>
                      {cargos.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-xs py-0.5 pl-3">
                          <div className="flex items-center gap-1">
                            <span className="text-ink-400">{c.concepto}</span>
                            <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${c.tipo === "cuota" ? "bg-blue-50 text-blue-600" : c.tipo === "comedor" ? "bg-green-50 text-green-600" : c.tipo === "material" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-ink-500"}`}>{c.tipo}</span>
                            {c.fechaVencimiento < new Date().toISOString().slice(0, 10) && (
                              <span className="text-[9px] text-red-500 font-semibold">VENCIDO</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-ink-900 font-medium">{eur(c.importe)}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateCargo(c.id, { estado: "pagado" }); toast(`Cargo "${c.concepto}" marcado como pagado`); }}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium">Pagar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ); })()}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Link href="/facturacion" className="text-xs text-coral-500 hover:text-coral-600 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <IconFile width={12} height={12} /> Ver facturación
                </Link>
                <button onClick={(e) => { e.stopPropagation(); setCargoFamiliaId(f.id); setCargoForm(p => ({ ...p, alumnoNombre: f.alumnos[0] || "" })); setShowCargoModal(true); }} className="text-xs text-coral-500 hover:text-coral-600 flex items-center gap-1">
                  <IconPlus width={12} height={12} /> Añadir cargo
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeFamilia(f.id); toast(`Familia ${f.nombre} eliminada`, "info"); }} className="text-xs text-ink-400 hover:text-red-400 flex items-center gap-1">
                  <IconTrash width={12} height={12} />
                </button>
              </div>
              <span className="text-xs text-ink-400">Click para editar</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Editar familia" : "Nueva familia"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Nombre de la familia <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: García López" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Email <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="maria@ejemplo.com" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Teléfono</label>
              <input className="input w-full" placeholder="600 00 00 00" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">IBAN (para domiciliación)</label>
              <input className="input w-full" placeholder="ES00 0000 0000 0000 0000 0000" value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">Alumnos</div>
              <button onClick={addAlumnoItem} className="text-xs text-coral-500 hover:text-coral-600">+ Añadir alumno</button>
            </div>
            <p className="text-xs text-ink-400">Añade cada alumno individualmente con su nombre y edad.</p>
            {form.alumnos.map((a, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input className="input w-full" placeholder="Nombre del alumno" value={a.nombre}
                    onChange={e => setForm(p => { const a2 = [...p.alumnos]; a2[i] = { ...a2[i], nombre: e.target.value }; return { ...p, alumnos: a2 }; })} />
                </div>
                <div className="w-32 space-y-1">
                  <select className="select w-full" value={a.edad} onChange={e => setForm(p => { const a2 = [...p.alumnos]; a2[i] = { ...a2[i], edad: e.target.value }; return { ...p, alumnos: a2 }; })}>
                    <option value="">Sin edad</option>
                    <option value="lactantes">Lactantes</option>
                    <option value="1 año">1 año</option>
                    <option value="2 años">2 años</option>
                    <option value="3 años">3 años</option>
                  </select>
                </div>
                <button onClick={() => removeAlumnoItem(i)} className="mt-1 text-ink-400 hover:text-red-400"><IconTrash width={14} height={14} /></button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="label">Servicios contratados</div>
              <button onClick={addServicioItem} className="text-xs text-coral-500 hover:text-coral-600">+ Añadir servicio</button>
            </div>
            <p className="text-xs text-ink-400">Selecciona los servicios que la familia tiene contratados. Estos servicios se usarán para generar las facturas automáticas.</p>
            {form.servicios.map((s, i) => {
              const esOtro = !s.concepto || !esCatalogo(s.concepto);
              return (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <select className="select w-full" value={esOtro ? "__otro__" : s.concepto} onChange={e => setServicioConcepto(i, e.target.value)}>
                    <option value="" disabled>Selecciona un servicio...</option>
                    {GRUPOS_SERVICIOS.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {SERVICIOS_CATALOGO.filter(g.filtro).map(c => <option key={c.concepto} value={c.concepto}>{c.concepto} — {eur(c.importe)}</option>)}
                      </optgroup>
                    ))}
                    <option value="__otro__">✏️ Otro concepto personalizado...</option>
                  </select>
                  {esOtro && (
                    <input className="input w-full" placeholder="Escribe el nombre del servicio" value={s.concepto === "__otro__" || !s.concepto ? "" : s.concepto} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], concepto: e.target.value }; return { ...p, servicios: s2 }; })} />
                  )}
                </div>
                <div className="w-28 space-y-1">
                  <input className="input w-full" placeholder="Importe €" type="number" step="0.01" value={s.importe || ""} onChange={e => setForm(p => { const s2 = [...p.servicios]; s2[i] = { ...s2[i], importe: parseFloat(e.target.value) || 0 }; return { ...p, servicios: s2 }; })} />
                </div>
                <button onClick={() => removeServicioItem(i)} className="mt-1 text-ink-400 hover:text-red-400"><IconTrash width={14} height={14} /></button>
              </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSubmit}>{editId ? "Guardar cambios" : "Añadir familia"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCargoModal} onClose={() => setShowCargoModal(false)} title="Añadir cargo pendiente">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Alumno <span className="text-coral-400">*</span></label>
            <select className="select w-full" value={cargoForm.alumnoNombre} onChange={e => setCargoForm(p => ({ ...p, alumnoNombre: e.target.value }))}>
              <option value="">Seleccionar alumno...</option>
              {cargoFamiliaId && familias.find(f => f.id === cargoFamiliaId)?.alumnos.map((a, i) => (
                <option key={i} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">Concepto <span className="text-coral-400">*</span></label>
            <input className="input w-full" placeholder="Ej: Material didáctico, Pañales..." value={cargoForm.concepto} onChange={e => setCargoForm(p => ({ ...p, concepto: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Importe (€) <span className="text-coral-400">*</span></label>
              <input className="input w-full" placeholder="0.00" type="number" step="0.01" value={cargoForm.importe} onChange={e => setCargoForm(p => ({ ...p, importe: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Tipo</label>
              <select className="select w-full" value={cargoForm.tipo} onChange={e => setCargoForm(p => ({ ...p, tipo: e.target.value as CargoPendiente["tipo"] }))}>
                <option value="cuota">Cuota</option>
                <option value="material">Material</option>
                <option value="extraescolar">Extraescolar</option>
                <option value="comedor">Comedor</option>
                <option value="matricula">Matrícula</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Fecha de vencimiento</label>
              <input className="input w-full" type="date" value={cargoForm.fechaVencimiento} onChange={e => setCargoForm(p => ({ ...p, fechaVencimiento: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink-700">Notas (opcional)</label>
              <input className="input w-full" placeholder="Ej: Pagado en efectivo..." value={cargoForm.notas} onChange={e => setCargoForm(p => ({ ...p, notas: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowCargoModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAddCargo}>Añadir cargo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
