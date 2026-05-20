"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Familia, Factura, Gasto, Empleado, Nomina, SuministroFactura, MenuSemanal, Incidencia, CategoriaGasto } from "@/types";
import type { AlumnoPerfil, RegistroAsistencia, Lead, Oportunidad, EscuelaConfig } from "@/types/crm";
import { FAMILIAS, FACTURAS, GASTOS, EMPLEADOS, NOMINAS, SUMINISTROS, MENU, INCIDENCIAS } from "./mock";
import { ALUMNOS_PERFILES, ASISTENCIA, LEADS, OPORTUNIDADES } from "./crm-mock";
import { clasificarGasto } from "@/lib/ai/simulated";
import { useAuth } from "@/lib/auth/AuthContext";
export interface StoreData {
  familias: Familia[];
  facturas: Factura[];
  gastos: Gasto[];
  empleados: Empleado[];
  nominas: Nomina[];
  suministros: SuministroFactura[];
  menu: MenuSemanal;
  incidencias: Incidencia[];
  alumnos: AlumnoPerfil[];
  asistencia: RegistroAsistencia[];
  leads: Lead[];
  oportunidades: Oportunidad[];
  configuracion: EscuelaConfig;
}

export interface BalanceItem {
  categoria: string;
  importe: number;
  mes: string;
}

export interface FinancialStatement {
  totalIngresos: number;
  totalGastos: number;
  resultado: number;
  ingresosPorFamilia: { familia: string; total: number }[];
  gastosPorCategoria: BalanceItem[];
  balanceMensual: { mes: string; ingresos: number; gastos: number; resultado: number }[];
  morososTotal: number;
  pendienteCobro: number;
  ratioGastosIngresos: number;
}

const OLD_STORE_KEY = "nido-demo-data";

let idCounter = Date.now();
export function genId(prefix = "id") { return `${prefix}-${++idCounter}`; }
export function nextFacturaNum() { return `F-2026-${String(FACTURAS.length + GASTOS.length + 1).padStart(3, "0")}`; }

interface DashboardMetrics {
  familiasCount: number;
  totalAlumnos: number;
  cobrado: number;
  pendiente: number;
  gastoMes: number;
  resultado: number;
  morosos: number;
  empleadosActivos: number;
  nominaTotal: number;
}

interface StoreActions {
  ready: boolean;
  set: <K extends keyof StoreData>(key: K, value: StoreData[K]) => void;
  updateConfiguracion: (changes: Partial<EscuelaConfig>) => void;
  addFamilia: (f: Familia) => void;
  updateFamilia: (id: string, changes: Partial<Familia>) => void;
  removeFamilia: (id: string) => void;
  addFactura: (f: Factura) => void;
  updateFactura: (id: string, changes: Partial<Factura>) => void;
  removeFactura: (id: string) => void;
  addGasto: (g: Gasto) => void;
  updateGasto: (id: string, changes: Partial<Gasto>) => void;
  removeGasto: (id: string) => void;
  addEmpleado: (e: Empleado) => void;
  updateEmpleado: (id: string, changes: Partial<Empleado>) => void;
  removeEmpleado: (id: string) => void;
  addNomina: (n: Nomina) => void;
  updateNomina: (id: string, changes: Partial<Nomina>) => void;
  addSuministro: (s: SuministroFactura) => void;
  updateMenu: (menu: MenuSemanal) => void;
  addIncidencia: (i: Incidencia) => void;
  updateIncidencia: (id: string, changes: Partial<Incidencia>) => void;
  generarNominasMes: (periodo: string) => void;
  addAlumno: (a: AlumnoPerfil) => void;
  updateAlumno: (id: string, changes: Partial<AlumnoPerfil>) => void;
  removeAlumno: (id: string) => void;
  addAsistencia: (r: RegistroAsistencia) => void;
  updateAsistencia: (id: string, changes: Partial<RegistroAsistencia>) => void;
  addLead: (l: Lead) => void;
  updateLead: (id: string, changes: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  addOportunidad: (o: Oportunidad) => void;
  updateOportunidad: (id: string, changes: Partial<Oportunidad>) => void;
  removeOportunidad: (id: string) => void;
  dashboardMetrics: DashboardMetrics;
  financialStatement: FinancialStatement;
  generarAsientosContables: () => { tipo: "ingreso" | "gasto"; concepto: string; importe: number; fecha: string; categoria: string }[];
  clasificarGasto: typeof clasificarGasto;
}

type StoreContextType = StoreData & StoreActions;

const StoreContext = createContext<StoreContextType | null>(null);

const CONFIG_DEFECTO: EscuelaConfig = { nombre: "Mi Escuela Infantil", nif: "", direccion: "", comunidadAutonoma: "", telefono: "" };

const DATA_VACIO: StoreData = {
  familias: [], facturas: [], gastos: [], empleados: [], nominas: [],
  suministros: [], menu: { lunes: { primero: "", segundo: "", postre: "" }, martes: { primero: "", segundo: "", postre: "" }, miercoles: { primero: "", segundo: "", postre: "" }, jueves: { primero: "", segundo: "", postre: "" }, viernes: { primero: "", segundo: "", postre: "" } },
  incidencias: [], alumnos: [], asistencia: [], leads: [], oportunidades: [],
  configuracion: CONFIG_DEFECTO,
};

const DATA_DEMO: StoreData = {
  familias: FAMILIAS, facturas: FACTURAS, gastos: GASTOS,
  empleados: EMPLEADOS, nominas: NOMINAS, suministros: SUMINISTROS,
  menu: MENU, incidencias: INCIDENCIAS,
  alumnos: ALUMNOS_PERFILES, asistencia: ASISTENCIA,
  leads: LEADS, oportunidades: OPORTUNIDADES,
  configuracion: { ...CONFIG_DEFECTO, nombre: "Escuela Infantil Nido Demo" },
};

function loadFromStorage(key: string): { data: StoreData | null; defaults: StoreData } {
  if (typeof window === "undefined") return { data: null, defaults: DATA_VACIO };
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { data: JSON.parse(raw), defaults: DATA_VACIO };
  } catch { }
  return { data: null, defaults: DATA_VACIO };
}

function saveToStorage(key: string, data: StoreData) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { }
}

function migrateOldKey(userId: string) {
  if (typeof window === "undefined") return;
  const newKey = `nido-${userId}`;
  try {
    const oldRaw = localStorage.getItem(OLD_STORE_KEY);
    if (oldRaw) {
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldRaw);
      }
      localStorage.removeItem(OLD_STORE_KEY);
    }
  } catch { }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = typeof window !== "undefined" ? auth.user : null;
  const isDemo = user?.role === "demo";
  const storeKey = user ? `nido-${user.id}` : `nido-anon`;
  const [data, setData] = useState<StoreData>(isDemo ? DATA_DEMO : DATA_VACIO);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") { setReady(true); return; }
    if (!user) { setReady(true); return; }
    migrateOldKey(user.id);
    try {
      const { data: stored, defaults } = loadFromStorage(storeKey);
      const base = isDemo ? DATA_DEMO : defaults;
      if (stored) {
        setData({ ...base, ...stored, alumnos: stored.alumnos || base.alumnos, asistencia: stored.asistencia || base.asistencia, leads: stored.leads || base.leads, oportunidades: stored.oportunidades || base.oportunidades });
      } else {
        setData(base);
      }
    } catch { }
    setReady(true);
  }, [user, storeKey, isDemo]);

  useEffect(() => {
    if (ready && user) saveToStorage(storeKey, data);
  }, [data, ready, storeKey, user]);

  const set = useCallback(<K extends keyof StoreData>(key: K, value: StoreData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const addFamilia = useCallback((f: Familia) => setData(p => ({ ...p, familias: [...p.familias, f] })), []);
  const updateFamilia = useCallback((id: string, changes: Partial<Familia>) => setData(p => ({ ...p, familias: p.familias.map(f => f.id === id ? { ...f, ...changes } : f) })), []);
  const removeFamilia = useCallback((id: string) => setData(p => ({ ...p, familias: p.familias.filter(f => f.id !== id) })), []);

  const addFactura = useCallback((f: Factura) => setData(p => ({ ...p, facturas: [...p.facturas, f] })), []);
  const updateFactura = useCallback((id: string, changes: Partial<Factura>) => setData(p => ({ ...p, facturas: p.facturas.map(f => f.id === id ? { ...f, ...changes } : f) })), []);
  const removeFactura = useCallback((id: string) => setData(p => ({ ...p, facturas: p.facturas.filter(f => f.id !== id) })), []);

  const addGasto = useCallback((g: Gasto) => setData(p => ({ ...p, gastos: [...p.gastos, g] })), []);
  const updateGasto = useCallback((id: string, changes: Partial<Gasto>) => setData(p => ({ ...p, gastos: p.gastos.map(g => g.id === id ? { ...g, ...changes } : g) })), []);
  const removeGasto = useCallback((id: string) => setData(p => ({ ...p, gastos: p.gastos.filter(g => g.id !== id) })), []);

  const addEmpleado = useCallback((e: Empleado) => setData(p => ({ ...p, empleados: [...p.empleados, e] })), []);
  const updateEmpleado = useCallback((id: string, changes: Partial<Empleado>) => setData(p => ({ ...p, empleados: p.empleados.map(e => e.id === id ? { ...e, ...changes } : e) })), []);
  const removeEmpleado = useCallback((id: string) => setData(p => ({ ...p, empleados: p.empleados.filter(e => e.id !== id) })), []);

  const addNomina = useCallback((n: Nomina) => setData(p => ({ ...p, nominas: [...p.nominas, n] })), []);
  const updateNomina = useCallback((id: string, changes: Partial<Nomina>) => setData(p => ({ ...p, nominas: p.nominas.map(n => n.id === id ? { ...n, ...changes } : n) })), []);
  const addSuministro = useCallback((s: SuministroFactura) => setData(p => ({ ...p, suministros: [...p.suministros, s] })), []);
  const updateMenu = useCallback((menu: MenuSemanal) => setData(p => ({ ...p, menu })), []);
  const addIncidencia = useCallback((i: Incidencia) => setData(p => ({ ...p, incidencias: [...p.incidencias, i] })), []);
  const updateIncidencia = useCallback((id: string, changes: Partial<Incidencia>) => setData(p => ({ ...p, incidencias: p.incidencias.map(i => i.id === id ? { ...i, ...changes } : i) })), []);

  const generarNominasMes = useCallback((periodo: string) => {
    setData(p => {
      const nuevas = p.empleados.filter(e => e.activo).map(e => {
        const bruto = e.salarioBrutoMensual;
        const irpf = bruto * (bruto > 2000 ? 0.18 : bruto > 1500 ? 0.15 : 0.10);
        const ssEmpleado = bruto * 0.0635;
        const ssEmpresa = bruto * 0.296;
        const neto = bruto - irpf - ssEmpleado;
        return {
          id: genId("nom"),
          empleadoId: e.id, periodo,
          bruto: Math.round(bruto * 100) / 100,
          irpf: Math.round(irpf * 100) / 100,
          ssEmpleado: Math.round(ssEmpleado * 100) / 100,
          ssEmpresa: Math.round(ssEmpresa * 100) / 100,
          neto: Math.round(neto * 100) / 100,
          pagada: false,
        };
      });
      const existentes = p.nominas.filter(n => n.periodo !== periodo);
      return { ...p, nominas: [...existentes, ...nuevas] };
    });
  }, []);

  const addAlumno = useCallback((a: AlumnoPerfil) => setData(p => ({ ...p, alumnos: [...p.alumnos, a] })), []);
  const updateAlumno = useCallback((id: string, changes: Partial<AlumnoPerfil>) => setData(p => ({ ...p, alumnos: p.alumnos.map(a => a.id === id ? { ...a, ...changes } : a) })), []);
  const removeAlumno = useCallback((id: string) => setData(p => ({ ...p, alumnos: p.alumnos.filter(a => a.id !== id) })), []);
  const addAsistencia = useCallback((r: RegistroAsistencia) => setData(p => ({ ...p, asistencia: [...p.asistencia, r] })), []);
  const updateAsistencia = useCallback((id: string, changes: Partial<RegistroAsistencia>) => setData(p => ({ ...p, asistencia: p.asistencia.map(r => r.id === id ? { ...r, ...changes } : r) })), []);
  const addLead = useCallback((l: Lead) => setData(p => ({ ...p, leads: [...p.leads, l] })), []);
  const updateLead = useCallback((id: string, changes: Partial<Lead>) => setData(p => ({ ...p, leads: p.leads.map(l => l.id === id ? { ...l, ...changes } : l) })), []);
  const removeLead = useCallback((id: string) => setData(p => ({ ...p, leads: p.leads.filter(l => l.id !== id) })), []);
  const addOportunidad = useCallback((o: Oportunidad) => setData(p => ({ ...p, oportunidades: [...p.oportunidades, o] })), []);
  const updateOportunidad = useCallback((id: string, changes: Partial<Oportunidad>) => setData(p => ({ ...p, oportunidades: p.oportunidades.map(o => o.id === id ? { ...o, ...changes } : o) })), []);
  const removeOportunidad = useCallback((id: string) => setData(p => ({ ...p, oportunidades: p.oportunidades.filter(o => o.id !== id) })), []);
  const updateConfiguracion = useCallback((changes: Partial<EscuelaConfig>) => setData(p => ({ ...p, configuracion: { ...p.configuracion, ...changes } })), []);

  const dashboardMetrics = useMemo(() => {
    return {
      familiasCount: data.familias.length,
      totalAlumnos: data.alumnos.length,
      cobrado: data.facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0),
      pendiente: data.facturas.filter(f => f.estado === "impago" || f.estado === "enviada").reduce((s, f) => s + f.total, 0),
      gastoMes: data.gastos.filter(g => g.fecha.startsWith("2026-06")).reduce((s, g) => s + g.importe, 0),
      resultado: data.facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0) - data.gastos.filter(g => g.fecha.startsWith("2026-06")).reduce((s, g) => s + g.importe, 0),
      morosos: data.facturas.filter(f => f.estado === "impago").length,
      empleadosActivos: data.empleados.filter(e => e.activo).length,
      nominaTotal: data.nominas.filter(n => n.periodo === "Mayo 2026").reduce((s, n) => s + n.bruto, 0),
    };
  }, [data]);

  const financialStatement = useMemo((): FinancialStatement => {
    const meses = ["Enero 2026", "Febrero 2026", "Marzo 2026", "Abril 2026", "Mayo 2026", "Junio 2026"];
    const mesesCorto = ["Enero 2026","Febrero 2026","Marzo 2026","Abril 2026","Mayo 2026","Junio 2026","Julio 2026","Agosto 2026","Septiembre 2026","Octubre 2026","Noviembre 2026","Diciembre 2026"];

    const balanceMensual = meses.map(mes => {
      const ingresos = data.facturas.filter(f => f.periodo === mes).reduce((s, f) => s + f.total, 0);
      const gastos = data.gastos.filter(g => {
        const [y, m] = g.fecha.split("-");
        const idx = parseInt(m) - 1;
        return mesesCorto[idx] === mes;
      }).reduce((s, g) => s + g.importe, 0);
      return { mes, ingresos, gastos, resultado: ingresos - gastos };
    });

    const totalIngresos = balanceMensual.reduce((s, m) => s + m.ingresos, 0);
    const totalGastos = balanceMensual.reduce((s, m) => s + m.gastos, 0);

    return {
      totalIngresos, totalGastos, resultado: totalIngresos - totalGastos,
      ingresosPorFamilia: data.familias.map(f => ({
        familia: f.nombre,
        total: data.facturas.filter(fc => fc.familiaId === f.id).reduce((s, fc) => s + fc.total, 0),
      })).filter(f => f.total > 0).sort((a, b) => b.total - a.total),
      gastosPorCategoria: data.gastos.reduce<any[]>((acc, g) => {
        acc.push({ categoria: g.categoria, importe: g.importe, mes: g.fecha.slice(0, 7) });
        return acc;
      }, []),
      balanceMensual,
      morososTotal: data.facturas.filter(f => f.estado === "impago").reduce((s, f) => s + f.total, 0),
      pendienteCobro: data.facturas.filter(f => f.estado === "enviada").reduce((s, f) => s + f.total, 0),
      ratioGastosIngresos: totalIngresos > 0 ? totalGastos / totalIngresos : 0,
    };
  }, [data]);

  const generarAsientosContables = useCallback(() => {
    const asientos: any[] = [];
    data.facturas.filter(f => f.estado === "pagada").forEach(f => asientos.push({ tipo: "ingreso", concepto: `Factura ${f.numero} - ${f.familia}`, importe: f.total, fecha: f.periodo, categoria: "cuotas" }));
    data.gastos.forEach(g => asientos.push({ tipo: "gasto", concepto: g.concepto, importe: g.importe, fecha: g.fecha, categoria: g.categoria }));
    return asientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [data]);

  const value: StoreContextType = {
    ...data, ready, dashboardMetrics, financialStatement,
    set,
    addFamilia, updateFamilia, removeFamilia,
    addFactura, updateFactura, removeFactura,
    addGasto, updateGasto, removeGasto,
    addEmpleado, updateEmpleado, removeEmpleado,
    addNomina, updateNomina,
    addSuministro,
    updateMenu, addIncidencia, updateIncidencia,
    addAlumno, updateAlumno, removeAlumno,
    addAsistencia, updateAsistencia,
    addLead, updateLead, removeLead,
    addOportunidad, updateOportunidad, removeOportunidad,
    updateConfiguracion,
    generarNominasMes, generarAsientosContables, clasificarGasto,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
