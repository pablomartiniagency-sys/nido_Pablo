"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { Familia, Factura, Gasto, Empleado, Nomina, SuministroFactura, MenuSemanal, Incidencia, CategoriaGasto, Tarea, CargoPendiente } from "@/types";
import type { AlumnoPerfil, RegistroAsistencia, Lead, Oportunidad, EscuelaConfig } from "@/types/crm";
import { FAMILIAS, FACTURAS, GASTOS, EMPLEADOS, NOMINAS, SUMINISTROS, MENU, INCIDENCIAS, CARGOS_PENDIENTES } from "./mock";
import { ALUMNOS_PERFILES, ASISTENCIA, LEADS, OPORTUNIDADES } from "./crm-mock";
import { clasificarGasto } from "@/lib/ai/simulated";
import { useAuth } from "@/lib/auth/AuthContext";
import { createIdentityClient } from "@/lib/supabase-identity";
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
  tareas: Tarea[];
  cargosPendientes: CargoPendiente[];
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

let idCounter = Date.now();
export function genId(prefix = "id") { return `${prefix}-${++idCounter}`; }
export function nextFacturaNum() { return `F-2026-${String(FACTURAS.length + GASTOS.length + 1).padStart(3, "0")}`; }

function mesActual(): string {
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const ahora = new Date();
  return `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

function calcularNomina(empleado: Empleado, periodo: string): Nomina {
  const bruto = empleado.salarioBrutoMensual;
  const irpf = bruto * (bruto > 2000 ? 0.18 : bruto > 1500 ? 0.15 : 0.10);
  const ssEmpleado = bruto * 0.0635;
  const ssEmpresa = bruto * 0.296;
  const neto = bruto - irpf - ssEmpleado;
  return {
    id: genId("nom"),
    empleadoId: empleado.id,
    periodo,
    bruto: Math.round(bruto * 100) / 100,
    irpf: Math.round(irpf * 100) / 100,
    ssEmpleado: Math.round(ssEmpleado * 100) / 100,
    ssEmpresa: Math.round(ssEmpresa * 100) / 100,
    neto: Math.round(neto * 100) / 100,
    pagada: false,
  };
}

export interface DashboardMetrics {
  familiasCount: number;
  totalAlumnos: number;
  cobrado: number;
  pendiente: number;
  gastoMes: number;
  resultado: number;
  morosos: number;
  empleadosActivos: number;
  nominaTotal: number;
  cargosPendientesTotal: number;
  cargosVencidosCount: number;
}

export interface StoreActions {
  ready: boolean;
  syncing: boolean;
  loadError: string | null;
  onboardingVersion: number;
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
  addTarea: (t: Tarea) => void;
  updateTarea: (id: string, changes: Partial<Tarea>) => void;
  removeTarea: (id: string) => void;
  addCargo: (c: CargoPendiente) => void;
  updateCargo: (id: string, changes: Partial<CargoPendiente>) => void;
  removeCargo: (id: string) => void;
  replayOnboarding: () => void;
}

type StoreContextType = StoreData & StoreActions;

const StoreContext = createContext<StoreContextType | null>(null);

const CONFIG_DEFECTO: EscuelaConfig = { nombre: "Mi Escuela Infantil", nif: "", direccion: "", comunidadAutonoma: "", telefono: "" };

const DATA_VACIO: StoreData = {
  familias: [], facturas: [], gastos: [], empleados: [], nominas: [],
  suministros: [], menu: { lunes: { primero: "", segundo: "", postre: "" }, martes: { primero: "", segundo: "", postre: "" }, miercoles: { primero: "", segundo: "", postre: "" }, jueves: { primero: "", segundo: "", postre: "" }, viernes: { primero: "", segundo: "", postre: "" } },
  incidencias: [], alumnos: [], asistencia: [], leads: [], oportunidades: [],
  configuracion: CONFIG_DEFECTO, tareas: [], cargosPendientes: [],
};

const DATA_DEMO: StoreData = {
  familias: FAMILIAS, facturas: FACTURAS, gastos: GASTOS,
  empleados: EMPLEADOS, nominas: NOMINAS, suministros: SUMINISTROS,
  menu: MENU, incidencias: INCIDENCIAS,
  alumnos: ALUMNOS_PERFILES, asistencia: ASISTENCIA,
  leads: LEADS, oportunidades: OPORTUNIDADES,
  configuracion: { ...CONFIG_DEFECTO, nombre: "Escuela Infantil Nido Demo" },
  tareas: [], cargosPendientes: CARGOS_PENDIENTES,
};

async function getAccessToken(): Promise<string | null> {
  const identity = createIdentityClient();
  if (!identity) return null;
  const { data: { session } } = await identity.auth.getSession();
  return session?.access_token || null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = typeof window !== "undefined" ? auth.user : null;
  const [data, setData] = useState<StoreData>(DATA_VACIO);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [onboardingVersion, setOnboardingVersion] = useState(0);

  const isEmptyOrDemo = (d: StoreData) => {
    return d.familias.length === 0 && d.facturas.length === 0 && d.gastos.length === 0;
  };

  useEffect(() => {
    if (typeof window === "undefined") { setReady(true); return; }
    if (!user) { setReady(true); return; }

    const loadData = async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const res = await fetch(`/api/data/sync`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const remote: StoreData = await res.json();
            if (isEmptyOrDemo(remote)) {
              setData(DATA_DEMO);
              setLoadError("Mostrando datos de demostración. Añade tus propios datos desde el panel.");
            } else {
              setData(remote);
            }
            setReady(true);
            return;
          }
        } catch {
          setLoadError("Error de conexión. Mostrando datos de demostración.");
        }
      }

      setData(DATA_DEMO);
      setReady(true);
    };

    loadData();
  }, [user]);

  // Debounced sync to Supabase on data change
  useEffect(() => {
    if (!ready || !user) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = await getAccessToken();
      if (!token) return;
      setSyncing(true);
      try {
        await fetch(`/api/data/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch { /* silent — next sync will retry */ }
      setSyncing(false);
    }, 2000);

    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [data, ready, user]);

  const set = useCallback(<K extends keyof StoreData>(key: K, value: StoreData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Parse a familia.alumnos name string like "Martina (3a)" → { nombre, curso }
  const parseAlumnoStr = (s: string) => {
    const m = s.match(/^(.+?)\s*\((\d+\s*año[s]?)\)$/);
    return m ? { nombre: m[1].trim(), curso: m[2] } : { nombre: s, curso: "" };
  };

  const addFamilia = useCallback((f: Familia) => setData(p => {
    const nuevos: AlumnoPerfil[] = f.alumnos.map((nameStr, i) => {
      const { nombre, curso } = parseAlumnoStr(nameStr);
      return {
        id: genId("al"), familiaId: f.id, nombre,
        fechaNac: "", edad: "", curso,
        fechaIngreso: new Date().toISOString().slice(0, 10), estado: "activo",
        alergias: [], vacunas: [], contactosEmergencia: [], autorizadosRecogida: [],
        documentos: [], autorizacionImagen: false,
      };
    });
    return { ...p, familias: [...p.familias, f], alumnos: [...p.alumnos, ...nuevos] };
  }), []);
  const updateFamilia = useCallback((id: string, changes: Partial<Familia>) => setData(p => {
    if (!changes.alumnos) {
      return { ...p, familias: p.familias.map(f => f.id === id ? { ...f, ...changes } : f) };
    }
    const old = p.familias.find(f => f.id === id);
    if (!old) return p;
    const newNames = changes.alumnos;
    const existing = p.alumnos.filter(a => a.familiaId === id);
    // Keep existing AlumnoPerfil whose nombre matches a new name, remove orphans
    const kept: AlumnoPerfil[] = [];
    const created: AlumnoPerfil[] = [];
    for (const nameStr of newNames) {
      const { nombre, curso } = parseAlumnoStr(nameStr);
      const match = existing.find(a => a.nombre === nombre);
      if (match) { kept.push(match); }
      else {
        created.push({
          id: genId("al"), familiaId: id, nombre,
          fechaNac: "", edad: "", curso,
          fechaIngreso: new Date().toISOString().slice(0, 10), estado: "activo",
          alergias: [], vacunas: [], contactosEmergencia: [], autorizadosRecogida: [],
          documentos: [], autorizacionImagen: false,
        });
      }
    }
    return {
      ...p,
      familias: p.familias.map(f => f.id === id ? { ...old, ...changes, alumnos: newNames } : f),
      alumnos: [...p.alumnos.filter(a => a.familiaId !== id), ...kept, ...created],
    };
  }), []);
  const removeFamilia = useCallback((id: string) => setData(p => ({
    ...p,
    familias: p.familias.filter(f => f.id !== id),
    alumnos: p.alumnos.filter(a => a.familiaId !== id),
  })), []);

  const addAlumno = useCallback((a: AlumnoPerfil) => setData(p => {
    const nombreStr = a.curso ? `${a.nombre} (${a.curso})` : a.nombre;
    return {
      ...p,
      alumnos: [...p.alumnos, a],
      familias: p.familias.map(f => f.id === a.familiaId
        ? { ...f, alumnos: f.alumnos.includes(nombreStr) ? f.alumnos : [...f.alumnos, nombreStr] }
        : f),
    };
  }), []);
  const updateAlumno = useCallback((id: string, changes: Partial<AlumnoPerfil>) => setData(p => {
    const old = p.alumnos.find(a => a.id === id);
    if (!old) return p;
    const updated = { ...old, ...changes };
    let familias = p.familias;
    // Remove old name from old family
    if ((changes.nombre || changes.curso || changes.familiaId) && old.familiaId) {
      const oldNameStr = old.curso ? `${old.nombre} (${old.curso})` : old.nombre;
      familias = familias.map(f => f.id === old.familiaId
        ? { ...f, alumnos: f.alumnos.filter(n => n !== oldNameStr) }
        : f);
    }
    // Add new name to (possibly new) family
    if (changes.nombre || changes.curso) {
      const famId = changes.familiaId || old.familiaId;
      const newNameStr = (changes.curso || old.curso)
        ? `${changes.nombre || old.nombre} (${changes.curso || old.curso})`
        : changes.nombre || old.nombre;
      if (famId) {
        familias = familias.map(f => f.id === famId && !f.alumnos.includes(newNameStr)
          ? { ...f, alumnos: [...f.alumnos, newNameStr] }
          : f);
      }
    }
    return { ...p, alumnos: p.alumnos.map(a => a.id === id ? updated : a), familias };
  }), []);
  const removeAlumno = useCallback((id: string) => setData(p => {
    const old = p.alumnos.find(a => a.id === id);
    if (!old) return { ...p, alumnos: p.alumnos.filter(a => a.id !== id) };
    const nameStr = old.curso ? `${old.nombre} (${old.curso})` : old.nombre;
    return {
      ...p,
      alumnos: p.alumnos.filter(a => a.id !== id),
      familias: p.familias.map(f => f.id === old.familiaId
        ? { ...f, alumnos: f.alumnos.filter(n => n !== nameStr) }
        : f),
    };
  }), []);

  const addFactura = useCallback((f: Factura) => setData(p => ({ ...p, facturas: [...p.facturas, f] })), []);
  const updateFactura = useCallback((id: string, changes: Partial<Factura>) => setData(p => ({ ...p, facturas: p.facturas.map(f => f.id === id ? { ...f, ...changes } : f) })), []);
  const removeFactura = useCallback((id: string) => setData(p => ({ ...p, facturas: p.facturas.filter(f => f.id !== id) })), []);

  const addGasto = useCallback((g: Gasto) => setData(p => ({ ...p, gastos: [...p.gastos, g] })), []);
  const updateGasto = useCallback((id: string, changes: Partial<Gasto>) => setData(p => ({ ...p, gastos: p.gastos.map(g => g.id === id ? { ...g, ...changes } : g) })), []);
  const removeGasto = useCallback((id: string) => setData(p => ({ ...p, gastos: p.gastos.filter(g => g.id !== id) })), []);

  const addEmpleado = useCallback((e: Empleado) => setData(p => {
    const periodo = mesActual();
    const nomina = calcularNomina(e, periodo);
    return { ...p, empleados: [...p.empleados, e], nominas: [...p.nominas, nomina] };
  }), []);
  const updateEmpleado = useCallback((id: string, changes: Partial<Empleado>) => setData(p => {
    let nominas = p.nominas;
    if (changes.salarioBrutoMensual !== undefined) {
      const periodo = mesActual();
      const bruto = changes.salarioBrutoMensual;
      const irpf = bruto * (bruto > 2000 ? 0.18 : bruto > 1500 ? 0.15 : 0.10);
      const ssEmpleado = bruto * 0.0635;
      const ssEmpresa = bruto * 0.296;
      const neto = bruto - irpf - ssEmpleado;
      const existing = p.nominas.find(n => n.empleadoId === id && n.periodo === periodo);
      if (existing) {
        nominas = p.nominas.map(n => n.empleadoId === id && n.periodo === periodo
          ? { ...n, bruto: Math.round(bruto * 100) / 100, irpf: Math.round(irpf * 100) / 100, ssEmpleado: Math.round(ssEmpleado * 100) / 100, ssEmpresa: Math.round(ssEmpresa * 100) / 100, neto: Math.round(neto * 100) / 100 }
          : n);
      } else {
        const oldEmp = p.empleados.find(e => e.id === id);
        if (oldEmp) {
          const updatedEmp = { ...oldEmp, ...changes };
          nominas = [...p.nominas, calcularNomina(updatedEmp, periodo)];
        }
      }
    }
    return { ...p, empleados: p.empleados.map(e => e.id === id ? { ...e, ...changes } : e), nominas };
  }), []);
  const removeEmpleado = useCallback((id: string) => setData(p => ({
    ...p,
    empleados: p.empleados.filter(e => e.id !== id),
    nominas: p.nominas.filter(n => n.empleadoId !== id),
  })), []);

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

  const addAsistencia = useCallback((r: RegistroAsistencia) => setData(p => ({ ...p, asistencia: [...p.asistencia, r] })), []);
  const updateAsistencia = useCallback((id: string, changes: Partial<RegistroAsistencia>) => setData(p => ({ ...p, asistencia: p.asistencia.map(r => r.id === id ? { ...r, ...changes } : r) })), []);
  const addLead = useCallback((l: Lead) => setData(p => ({ ...p, leads: [...p.leads, l] })), []);
  const updateLead = useCallback((id: string, changes: Partial<Lead>) => setData(p => ({ ...p, leads: p.leads.map(l => l.id === id ? { ...l, ...changes } : l) })), []);
  const removeLead = useCallback((id: string) => setData(p => ({ ...p, leads: p.leads.filter(l => l.id !== id) })), []);
  const addOportunidad = useCallback((o: Oportunidad) => setData(p => ({ ...p, oportunidades: [...p.oportunidades, o] })), []);
  const updateOportunidad = useCallback((id: string, changes: Partial<Oportunidad>) => setData(p => ({ ...p, oportunidades: p.oportunidades.map(o => o.id === id ? { ...o, ...changes } : o) })), []);
  const removeOportunidad = useCallback((id: string) => setData(p => ({ ...p, oportunidades: p.oportunidades.filter(o => o.id !== id) })), []);
  const updateConfiguracion = useCallback((changes: Partial<EscuelaConfig>) => setData(p => ({ ...p, configuracion: { ...p.configuracion, ...changes } })), []);
  const addTarea = useCallback((t: Tarea) => setData(p => ({ ...p, tareas: [...p.tareas, t] })), []);
  const updateTarea = useCallback((id: string, changes: Partial<Tarea>) => setData(p => ({ ...p, tareas: p.tareas.map(t => t.id === id ? { ...t, ...changes } : t) })), []);
  const removeTarea = useCallback((id: string) => setData(p => ({ ...p, tareas: p.tareas.filter(t => t.id !== id) })), []);
  const addCargo = useCallback((c: CargoPendiente) => setData(p => ({ ...p, cargosPendientes: [...p.cargosPendientes, c] })), []);
  const updateCargo = useCallback((id: string, changes: Partial<CargoPendiente>) => setData(p => ({ ...p, cargosPendientes: p.cargosPendientes.map(c => c.id === id ? { ...c, ...changes } : c) })), []);
  const removeCargo = useCallback((id: string) => setData(p => ({ ...p, cargosPendientes: p.cargosPendientes.filter(c => c.id !== id) })), []);

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const mesPrefijo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const mesesES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const mesActualTexto = `${mesesES[now.getMonth()]} ${now.getFullYear()}`;
    const mesAnteriorTexto = now.getMonth() === 0
      ? `Diciembre ${now.getFullYear() - 1}`
      : `${mesesES[now.getMonth() - 1]} ${now.getFullYear()}`;
    const cargosPendientesTotal = data.cargosPendientes.filter(c => c.estado === "pendiente").reduce((s, c) => s + c.importe, 0);
    const cargosVencidos = data.cargosPendientes.filter(c => c.estado === "pendiente" && c.fechaVencimiento < new Date().toISOString().slice(0, 10));
    return {
      familiasCount: data.familias.length,
      totalAlumnos: data.alumnos.length,
      cobrado: data.facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0),
      pendiente: data.facturas.filter(f => f.estado === "impago" || f.estado === "enviada").reduce((s, f) => s + f.total, 0),
      gastoMes: data.gastos.filter(g => g.fecha.startsWith(mesPrefijo)).reduce((s, g) => s + g.importe, 0),
      resultado: data.facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0) - data.gastos.filter(g => g.fecha.startsWith(mesPrefijo)).reduce((s, g) => s + g.importe, 0),
      morosos: data.facturas.filter(f => f.estado === "impago").length,
      empleadosActivos: data.empleados.filter(e => e.activo).length,
      nominaTotal: data.nominas.filter(n => n.periodo === mesAnteriorTexto).reduce((s, n) => s + n.bruto, 0),
      cargosPendientesTotal,
      cargosVencidosCount: cargosVencidos.length,
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
    addTarea, updateTarea, removeTarea,
    addCargo, updateCargo, removeCargo,
    generarNominasMes, generarAsientosContables, clasificarGasto,
    replayOnboarding: () => {
      if (typeof window !== "undefined") {
        const key = `nido-onboarding-${user?.id || "anon"}`;
        localStorage.removeItem(key);
      }
      setOnboardingVersion(v => v + 1);
    },
    syncing, loadError, onboardingVersion,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
