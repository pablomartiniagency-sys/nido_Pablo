import type { Factura, Gasto } from "@/types";

export interface FinancialReport {
  ingresosTotales: number;
  ingresosCobrados: number;
  ingresosPendientes: number;
  gastosOperativos: number;
  gastosPorCategoria: { categoria: string; importe: number; pct: number }[];
  ebitda: number;
  margenEbitda: number;
  amortizacion: number;
  ebit: number;
  resultadoNeto: number;

  activos: { caja: number; clientes: number; activosFijos: number; total: number };
  pasivos: { proveedores: number; adminPub: number; total: number };
  patrimonioNeto: number;

  liquidez: number;
  endeudamiento: number;
  rentabilidad: number;

  proyeccionTrimestral: { trimestre: string; ingresos: number; gastos: number; ebitda: number }[];
}

export function generarReporteFinanciero(facturas: Factura[], gastos: Gasto[], periodo: string, manualBalance?: { caja: number; proveedores: number; activosFijos: number; deuda: number }): FinancialReport {
  const facturasPeriodo = periodo ? facturas : facturas;
  const gastosPeriodo = periodo ? gastos.filter(g => g.fecha.startsWith(periodo.slice(0, 7))) : gastos;

  const ingresosCobrados = facturasPeriodo.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
  const ingresosPendientes = facturasPeriodo.filter(f => f.estado === "enviada" || f.estado === "impago").reduce((s, f) => s + f.total, 0);
  const ingresosTotales = ingresosCobrados + ingresosPendientes;

  const gastosOperativos = gastosPeriodo.reduce((s, g) => s + g.importe, 0);

  const gastosPorCategoriaMap = new Map<string, number>();
  gastosPeriodo.forEach(g => {
    gastosPorCategoriaMap.set(g.categoria, (gastosPorCategoriaMap.get(g.categoria) || 0) + g.importe);
  });
  const gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries())
    .map(([categoria, importe]) => ({
      categoria,
      importe,
      pct: gastosOperativos > 0 ? (importe / gastosOperativos) * 100 : 0,
    }))
    .sort((a, b) => b.importe - a.importe);

  const amortizacion = 0;
  const ebitda = ingresosTotales - gastosOperativos;
  const margenEbitda = ingresosTotales > 0 ? (ebitda / ingresosTotales) * 100 : 0;
  const ebit = ebitda;
  const resultadoNeto = ebit;

  const caja = manualBalance?.caja ?? 0;
  const clientes = ingresosPendientes;
  const activosFijos = manualBalance?.activosFijos ?? 0;
  const totalActivos = caja + clientes + activosFijos;

  const proveedores = manualBalance?.proveedores ?? 0;
  const deuda = manualBalance?.deuda ?? 0;
  const adminPub = 0; // IVA/IRPF could be estimated, but leaving 0 for now
  const totalPasivos = proveedores + adminPub + deuda;
  const patrimonioNeto = totalActivos - totalPasivos;

  const activosCorrientes = caja + clientes;
  const pasivosCorrientes = proveedores + adminPub + (deuda * 0.2); // assuming 20% of debt is short-term
  const liquidez = pasivosCorrientes > 0 ? activosCorrientes / pasivosCorrientes : (activosCorrientes > 0 ? 9.99 : 0);
  const endeudamiento = totalActivos > 0 ? totalPasivos / totalActivos : 0;
  const rentabilidad = ingresosTotales > 0 ? (resultadoNeto / ingresosTotales) * 100 : 0;

  const proyeccionTrimestral = [
    { trimestre: "Q1 2026", ingresos: ingresosTotales * 0.9, gastos: gastosOperativos * 0.85, ebitda: ebitda * 0.85 },
    { trimestre: "Q2 2026", ingresos: ingresosTotales * 1.0, gastos: gastosOperativos * 1.0, ebitda: ebitda * 1.0 },
    { trimestre: "Q3 2026", ingresos: ingresosTotales * 0.85, gastos: gastosOperativos * 0.95, ebitda: ebitda * 0.7 },
  ];

  return {
    ingresosTotales, ingresosCobrados, ingresosPendientes,
    gastosOperativos, gastosPorCategoria,
    ebitda, margenEbitda, amortizacion, ebit, resultadoNeto,
    activos: { caja, clientes, activosFijos, total: totalActivos },
    pasivos: { proveedores, adminPub, total: totalPasivos },
    patrimonioNeto,
    liquidez, endeudamiento, rentabilidad,
    proyeccionTrimestral,
  };
}

export function calcularRatios(reporte: FinancialReport) {
  return {
    ebitda: { label: "EBITDA", value: reporte.ebitda, healthy: reporte.margenEbitda > 15 },
    margenEbitda: { label: "Margen EBITDA", value: reporte.margenEbitda, healthy: reporte.margenEbitda > 15 },
    liquidez: { label: "Liquidez", value: reporte.liquidez || 0, healthy: reporte.liquidez > 1.5 },
    endeudamiento: { label: "Endeudamiento", value: reporte.endeudamiento || 0, healthy: reporte.endeudamiento < 0.5 },
    rentabilidad: { label: "Rentabilidad neta", value: reporte.rentabilidad, healthy: reporte.rentabilidad > 10 },
    ebit: { label: "EBIT", value: reporte.ebit, healthy: reporte.ebit > 0 },
  };
}
