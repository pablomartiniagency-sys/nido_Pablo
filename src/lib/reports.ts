import type { Factura, Gasto, Familia } from "@/types";

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fechaES(fecha: string) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function periodoES(periodo: string) {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const parts = periodo.split(" ");
  if (parts.length === 2) {
    const mes = meses.indexOf(parts[0]) + 1;
    return { mes, año: parts[1] };
  }
  return { mes: 1, año: "2026" };
}

function trimestreFromMes(mes: number): number {
  return Math.ceil(mes / 3);
}

function openPrintWindow(title: string, html: string) {
  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) { alert("Permite ventanas emergentes para generar el informe"); return; }
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page { margin: 20mm 15mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #3b3b98; color: #3b3b98; }
        h3 { font-size: 12px; margin: 12px 0 6px; color: #555; }
        .header { text-align: center; margin-bottom: 24px; }
        .header p { color: #666; font-size: 10px; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { padding: 5px 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 10px; }
        th { background: #f0f0f5; font-weight: 600; font-size: 9px; text-transform: uppercase; color: #555; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .total-row { background: #f8f8ff; font-weight: 700; border-top: 2px solid #3b3b98; }
        .summary-box { background: #f8f8ff; border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; margin: 12px 0; }
        .summary-box .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
        .summary-box .row.total { font-weight: 700; border-top: 1px solid #ddd; margin-top: 4px; padding-top: 6px; font-size: 13px; }
        .footer { text-align: center; margin-top: 32px; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; }
        .badge-green { background: #d4edda; color: #155724; }
        .badge-red { background: #f8d7da; color: #721c24; }
        .badge-amber { background: #fff3cd; color: #856404; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align:right;margin-bottom:12px">
        <button onclick="window.print()" style="padding:8px 20px;background:#3b3b98;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">🖨️ Imprimir / Guardar PDF</button>
      </div>
      ${html}
      <div class="footer">Generado por Nido — ${new Date().toLocaleDateString("es-ES")}</div>
    </body>
    </html>
  `);
  w.document.close();
}

/* ─── Modelo 303: IVA Trimestral ─── */
export function generateModelo303(facturas: Factura[], gastos: Gasto[], trimestre: number, año: string) {
  const mesesTrimestre = (trimestre - 1) * 3 + 1;
  const getPeriodoMes = (p: string) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const parts = p.split(" ");
    return parts.length === 2 ? meses.indexOf(parts[0]) + 1 : 0;
  };

  const facturasTrim = facturas.filter(f => {
    const m = getPeriodoMes(f.periodo);
    return m >= mesesTrimestre && m < mesesTrimestre + 3;
  });
  const gastosTrim = gastos.filter(g => {
    const [y, m] = g.fecha.split("-").map(Number);
    return y === parseInt(año) && m >= mesesTrimestre && m < mesesTrimestre + 3;
  });

  const baseRepercutida = facturasTrim.reduce((s, f) => s + Math.round(f.total / (1 + (f.items[0]?.concepto.includes("exento") ? 0 : 0.21)) * 100) / 100, 0);
  const ivaRepercutido = facturasTrim.reduce((s, f) => s + Math.round(f.total * 0.21 * 100) / 100, 0);
  const baseSoportada = gastosTrim.reduce((s, g) => s + Math.round(g.importe / (1 + g.iva / 100) * 100) / 100, 0);
  const ivaSoportado = gastosTrim.reduce((s, g) => s + Math.round(g.importe - (g.importe / (1 + g.iva / 100)) * 100) / 100, 0);
  const resultado = Math.round((ivaRepercutido - ivaSoportado) * 100) / 100;

  const html = `
    <div class="header">
      <h1>Modelo 303 — IVA Trimestral</h1>
      <p>${trimestre}º Trimestre ${año}</p>
      <p>${facturasTrim.length} facturas · ${gastosTrim.length} gastos</p>
    </div>

    <h2>IVA Repercutido (Ventas)</h2>
    <table>
      <tr><th>Concepto</th><th class="text-right">Base Imponible</th><th class="text-right">Tipo</th><th class="text-right">Cuota</th></tr>
      <tr><td>Operaciones generales</td><td class="text-right">${eur(baseRepercutida)}</td><td class="text-right">21%</td><td class="text-right">${eur(ivaRepercutido)}</td></tr>
      <tr class="total-row"><td>Total IVA Repercutido</td><td class="text-right">${eur(baseRepercutida)}</td><td></td><td class="text-right">${eur(ivaRepercutido)}</td></tr>
    </table>

    <h2>IVA Soportado (Compras)</h2>
    <table>
      <tr><th>Concepto</th><th class="text-right">Base Imponible</th><th class="text-right">Tipo</th><th class="text-right">Cuota</th></tr>
      <tr><td>Operaciones generales</td><td class="text-right">${eur(baseSoportada)}</td><td class="text-right">21%</td><td class="text-right">${eur(ivaSoportado)}</td></tr>
      <tr class="total-row"><td>Total IVA Soportado</td><td class="text-right">${eur(baseSoportada)}</td><td></td><td class="text-right">${eur(ivaSoportado)}</td></tr>
    </table>

    <h2>Resultado</h2>
    <div class="summary-box">
      <div class="row"><span>IVA Repercutido</span><span>${eur(ivaRepercutido)}</span></div>
      <div class="row"><span>IVA Soportado</span><span>${eur(ivaSoportado)}</span></div>
      <div class="row total"><span>Resultado ${resultado >= 0 ? "a ingresar" : "a compensar"}</span><span>${eur(Math.abs(resultado))}</span></div>
    </div>

    <h2>Detalle de facturas (${facturasTrim.length})</h2>
    <table>
      <tr><th>Nº Factura</th><th>Familia</th><th>Período</th><th class="text-right">Total</th></tr>
      ${facturasTrim.map(f => `<tr><td>${f.numero}</td><td>${f.familia}</td><td>${f.periodo}</td><td class="text-right">${eur(f.total)}</td></tr>`).join("")}
    </table>

    <h2>Detalle de gastos (${gastosTrim.length})</h2>
    <table>
      <tr><th>Fecha</th><th>Proveedor</th><th>Concepto</th><th class="text-right">Importe</th></tr>
      ${gastosTrim.map(g => `<tr><td>${fechaES(g.fecha)}</td><td>${g.proveedor}</td><td>${g.concepto}</td><td class="text-right">${eur(g.importe)}</td></tr>`).join("")}
    </table>
  `;

  openPrintWindow(`Modelo 303 - ${trimestre}T ${año}`, html);
}

/* ─── Modelo 390: Resumen Anual IVA ─── */
export function generateModelo390(facturas: Factura[], gastos: Gasto[], año: string) {
  const getPeriodoMes = (p: string) => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const parts = p.split(" ");
    return parts.length === 2 ? meses.indexOf(parts[0]) + 1 : 0;
  };

  const trimestres = [1, 2, 3, 4].map(t => {
    const ms = (t - 1) * 3 + 1;
    const fs = facturas.filter(f => { const m = getPeriodoMes(f.periodo); return m >= ms && m < ms + 3; });
    const gs = gastos.filter(g => { const [y, m] = g.fecha.split("-").map(Number); return y === parseInt(año) && m >= ms && m < ms + 3; });
    const bR = fs.reduce((s, f) => s + Math.round(f.total / 1.21 * 100) / 100, 0);
    const iR = fs.reduce((s, f) => s + Math.round(f.total * 0.21 * 100) / 100, 0);
    const bS = gs.reduce((s, g) => s + Math.round(g.importe / (1 + g.iva / 100) * 100) / 100, 0);
    const iS = gs.reduce((s, g) => s + Math.round(g.importe - (g.importe / (1 + g.iva / 100)) * 100) / 100, 0);
    return { trimestre: t, facturas: fs.length, gastos: gs.length, baseRepercutida: bR, ivaRepercutido: iR, baseSoportada: bS, ivaSoportado: iS, resultado: Math.round((iR - iS) * 100) / 100 };
  });

  const totalFacturas = facturas.filter(f => { const m = getPeriodoMes(f.periodo); return m >= 1 && m <= 12; }).length;
  const totalGastos = gastos.filter(g => g.fecha.startsWith(año)).length;
  const totalBR = trimestres.reduce((s, t) => s + t.baseRepercutida, 0);
  const totalIR = trimestres.reduce((s, t) => s + t.ivaRepercutido, 0);
  const totalBS = trimestres.reduce((s, t) => s + t.baseSoportada, 0);
  const totalIS = trimestres.reduce((s, t) => s + t.ivaSoportado, 0);
  const totalResultado = Math.round((totalIR - totalIS) * 100) / 100;

  const html = `
    <div class="header">
      <h1>Modelo 390 — Resumen Anual de IVA</h1>
      <p>Ejercicio ${año}</p>
      <p>${totalFacturas} facturas · ${totalGastos} gastos</p>
    </div>

    <h2>Resumen por trimestres</h2>
    <table>
      <tr><th>Trimestre</th><th class="text-right">Facturas</th><th class="text-right">Gastos</th><th class="text-right">Base Repercutida</th><th class="text-right">IVA Repercutido</th><th class="text-right">Base Soportada</th><th class="text-right">IVA Soportado</th><th class="text-right">Resultado</th></tr>
      ${trimestres.map(t => `
        <tr>
          <td>${t.trimestre}º Trimestre</td><td class="text-right">${t.facturas}</td><td class="text-right">${t.gastos}</td>
          <td class="text-right">${eur(t.baseRepercutida)}</td><td class="text-right">${eur(t.ivaRepercutido)}</td>
          <td class="text-right">${eur(t.baseSoportada)}</td><td class="text-right">${eur(t.ivaSoportado)}</td>
          <td class="text-right ${t.resultado >= 0 ? "" : "font-bold"}">${eur(t.resultado)}</td>
        </tr>
      `).join("")}
      <tr class="total-row">
        <td>Total</td><td class="text-right">${totalFacturas}</td><td class="text-right">${totalGastos}</td>
        <td class="text-right">${eur(totalBR)}</td><td class="text-right">${eur(totalIR)}</td>
        <td class="text-right">${eur(totalBS)}</td><td class="text-right">${eur(totalIS)}</td>
        <td class="text-right">${eur(totalResultado)}</td>
      </tr>
    </table>

    <div class="summary-box">
      <div class="row"><span>Total IVA Repercutido</span><span>${eur(totalIR)}</span></div>
      <div class="row"><span>Total IVA Soportado</span><span>${eur(totalIS)}</span></div>
      <div class="row total"><span>Resultado anual ${totalResultado >= 0 ? "a ingresar" : "a compensar"}</span><span>${eur(Math.abs(totalResultado))}</span></div>
    </div>

    <h2>Resumen operaciones</h2>
    <table>
      <tr><th>Concepto</th><th class="text-right">Base Imponible</th><th class="text-right">IVA</th></tr>
      <tr><td>Operaciones sujetas a IVA (repercutido)</td><td class="text-right">${eur(totalBR)}</td><td class="text-right">${eur(totalIR)}</td></tr>
      <tr><td>Operaciones sujetas a IVA (soportado)</td><td class="text-right">${eur(totalBS)}</td><td class="text-right">${eur(totalIS)}</td></tr>
      <tr><td>Operaciones no sujetas / exentas</td><td class="text-right">0,00 €</td><td class="text-right">0,00 €</td></tr>
    </table>
  `;

  openPrintWindow(`Modelo 390 - ${año}`, html);
}

/* ─── Informe de Gestoría ─── */
export function generateInformeGestoria(facturas: Factura[], gastos: Gasto[], familias: Familia[]) {
  const totalFacturado = facturas.reduce((s, f) => s + f.total, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.importe, 0);
  const cobrado = facturas.filter(f => f.estado === "pagada").reduce((s, f) => s + f.total, 0);
  const pendiente = facturas.filter(f => f.estado === "impago" || f.estado === "enviada").reduce((s, f) => s + f.total, 0);
  const morosos = facturas.filter(f => f.estado === "impago").length;

  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.importe;
    return acc;
  }, {});

  const html = `
    <div class="header">
      <h1>Informe de Gestoría</h1>
      <p>Generado el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
    </div>

    <div class="grid-2">
      <div class="summary-box">
        <div class="row"><span>Total facturado</span><span>${eur(totalFacturado)}</span></div>
        <div class="row"><span>Total cobrado</span><span>${eur(cobrado)}</span></div>
        <div class="row"><span>Pendiente de cobro</span><span>${eur(pendiente)}</span></div>
        <div class="row"><span>Morosos</span><span>${morosos} familias</span></div>
      </div>
      <div class="summary-box">
        <div class="row"><span>Total gastos</span><span>${eur(totalGastos)}</span></div>
        <div class="row"><span>Familias activas</span><span>${familias.length}</span></div>
        <div class="row"><span>Facturas emitidas</span><span>${facturas.length}</span></div>
        <div class="row total"><span>Resultado neto</span><span>${eur(totalFacturado - totalGastos)}</span></div>
      </div>
    </div>

    <h2>Facturas emitidas (${facturas.length})</h2>
    <table>
      <tr><th>Nº</th><th>Familia</th><th>Período</th><th class="text-right">Total</th><th>Estado</th></tr>
      ${facturas.map(f => `<tr>
        <td>${f.numero}</td><td>${f.familia}</td><td>${f.periodo}</td>
        <td class="text-right">${eur(f.total)}</td>
        <td><span class="badge ${f.estado === "pagada" ? "badge-green" : f.estado === "impago" ? "badge-red" : "badge-amber"}">${f.estado}</span></td>
      </tr>`).join("")}
      <tr class="total-row"><td colspan="3">Total</td><td class="text-right">${eur(totalFacturado)}</td><td></td></tr>
    </table>

    <h2>Gastos por categoría</h2>
    <table>
      <tr><th>Categoría</th><th class="text-right">Total</th><th class="text-right">%</th></tr>
      ${Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]).map(([cat, total]) => `
        <tr><td>${cat}</td><td class="text-right">${eur(total)}</td><td class="text-right">${totalGastos > 0 ? ((total / totalGastos) * 100).toFixed(1) : 0}%</td></tr>
      `).join("")}
      <tr class="total-row"><td>Total</td><td class="text-right">${eur(totalGastos)}</td><td class="text-right">100%</td></tr>
    </table>

    <h2>Resumen IVA</h2>
    <table>
      <tr><th>Concepto</th><th class="text-right">Base</th><th class="text-right">IVA (21%)</th><th class="text-right">Total</th></tr>
      <tr><td>IVA Repercutido (facturas)</td><td class="text-right">${eur(Math.round(totalFacturado / 1.21 * 100) / 100)}</td><td class="text-right">${eur(Math.round(totalFacturado * 0.21 * 100) / 100)}</td><td class="text-right">${eur(totalFacturado)}</td></tr>
      <tr><td>IVA Soportado (gastos)</td><td class="text-right">${eur(Math.round(totalGastos / 1.21 * 100) / 100)}</td><td class="text-right">${eur(Math.round(totalGastos * 0.21 * 100) / 100)}</td><td class="text-right">${eur(totalGastos)}</td></tr>
    </table>
  `;

  openPrintWindow("Informe de Gestoría", html);
}
