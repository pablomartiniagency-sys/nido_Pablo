import type { Factura, Gasto } from "@/types";

export interface FinancialReport {
  // P&L
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

  // Balance resumido
  activos: { caja: number; clientes: number; activosFijos: number; total: number };
  pasivos: { proveedores: number; adminPub: number; total: number };
  patrimonioNeto: number;

  // Ratios
  liquidez: number;
  endeudamiento: number;
  rentabilidad: number;

  // Proyección
  proyeccionTrimestral: { trimestre: string; ingresos: number; gastos: number; ebitda: number }[];
}

const AMORTIZACION_ANUAL_PCT = 0.10; // 10% anual sobre activos fijos estimados
const ACTIVOS_FIJOS_ESTIMADOS = 45000; // mobiliario, equipos, reformas

export function generarReporteFinanciero(facturas: Factura[], gastos: Gasto[], periodo: string): FinancialReport {
  // Filtramos por periodo si se especifica, sino todo
  const facturasPeriodo = periodo ? facturas : facturas;
  const gastosPeriodo = periodo ? gastos.filter(g => g.fecha.startsWith(periodo.slice(0, 7))) : gastos;

  const ingresosCobrados = facturasPeriodo.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
  const ingresosPendientes = facturasPeriodo.filter(f => f.estado === "enviada" || f.estado === "impago").reduce((s, f) => s + f.total, 0);
  const ingresosTotales = ingresosCobrados + ingresosPendientes;

  // Gastos operativos (todo excepto amortización)
  const gastosOperativos = gastosPeriodo.reduce((s, g) => s + g.importe, 0);

  // Gastos por categoría
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

  // EBITDA = Ingresos - Gastos operativos (sin amortización ni intereses ni impuestos)
  const amortizacionMensual = (ACTIVOS_FIJOS_ESTIMADOS * AMORTIZACION_ANUAL_PCT) / 12;
  const amortizacion = periodo ? amortizacionMensual : ACTIVOS_FIJOS_ESTIMADOS * AMORTIZACION_ANUAL_PCT;
  const ebitda = ingresosTotales - gastosOperativos;
  const margenEbitda = ingresosTotales > 0 ? (ebitda / ingresosTotales) * 100 : 0;
  const ebit = ebitda - amortizacion;
  const resultadoNeto = ebit; // simplificado sin impuestos

  // Balance resumido
  const caja = ingresosCobrados * 0.3; // estimación: 30% de lo cobrado está disponible
  const clientes = ingresosPendientes;
  const activosFijos = ACTIVOS_FIJOS_ESTIMADOS - (periodo ? 0 : ACTIVOS_FIJOS_ESTIMADOS * AMORTIZACION_ANUAL_PCT);
  const totalActivos = caja + clientes + activosFijos;

  const proveedores = gastosPeriodo.filter(g => g.recurrencia === "mensual").reduce((s, g) => s + g.importe, 0) * 0.5;
  const adminPub = (gastosOperativos * 0.21) * 0.25; // IVA pendiente + SS
  const totalPasivos = proveedores + adminPub;
  const patrimonioNeto = totalActivos - totalPasivos;

  // Ratios
  const liquidez = totalPasivos > 0 ? caja / (totalPasivos / 2) : 0;
  const endeudamiento = patrimonioNeto > 0 ? totalPasivos / patrimonioNeto : 0;
  const rentabilidad = ingresosTotales > 0 ? (resultadoNeto / ingresosTotales) * 100 : 0;

  // Proyección trimestral
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
    liquidez: { label: "Liquidez", value: reporte.liquidez, healthy: reporte.liquidez > 1.5 },
    endeudamiento: { label: "Endeudamiento", value: reporte.endeudamiento, healthy: reporte.endeudamiento < 0.5 },
    rentabilidad: { label: "Rentabilidad neta", value: reporte.rentabilidad, healthy: reporte.rentabilidad > 10 },
    ebit: { label: "EBIT", value: reporte.ebit, healthy: reporte.ebit > 0 },
  };
}
