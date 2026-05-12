function escapeCsv(val: string | number | undefined | null): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function download(filename: string, csv: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportFamiliasCSV(
  familias: { id: string; nombre: string; email: string; telefono: string; iban: string; alumnos: string[] }[],
) {
  const header = "ID,Nombre,Email,Teléfono,IBAN,Alumnos";
  const rows = familias.map(f =>
    [f.id, f.nombre, f.email, f.telefono, f.iban, f.alumnos.join("; ")].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-familias-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}

export function exportFacturasCSV(
  facturas: { id: string; numero: string; familia: string; periodo: string; total: number; estado: string }[],
) {
  const header = "ID,Número,Cliente,Período,Total,Estado";
  const rows = facturas.map(f =>
    [f.id, f.numero, f.familia, f.periodo, f.total, f.estado].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-facturas-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}

export function exportGastosCSV(
  gastos: { id: string; fecha: string; proveedor: string; concepto: string; importe: number; categoria: string }[],
) {
  const header = "ID,Fecha,Proveedor,Concepto,Importe,Categoría";
  const rows = gastos.map(g =>
    [g.id, g.fecha, g.proveedor, g.concepto, g.importe, g.categoria].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-gastos-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}

export function exportAlumnosCSV(
  alumnos: { id: string; nombre: string; fechaNac: string; curso: string; estado: string; alergias: string }[],
) {
  const header = "ID,Nombre,Fecha Nac.,Curso,Estado,Alergias";
  const rows = alumnos.map(a =>
    [a.id, a.nombre, a.fechaNac, a.curso, a.estado, a.alergias].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-alumnos-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}

export function exportLeadsCSV(
  leads: { id: string; nombre: string; email: string; telefono: string; fuente: string; estado: string; fechaContacto: string }[],
) {
  const header = "ID,Nombre,Email,Teléfono,Fuente,Estado,Fecha Contacto";
  const rows = leads.map(l =>
    [l.id, l.nombre, l.email, l.telefono, l.fuente, l.estado, l.fechaContacto].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-leads-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}

export function exportEmpleadosCSV(
  empleados: { id: string; nombre: string; dni: string; puesto: string; salarioBrutoMensual: number; activo: boolean }[],
) {
  const header = "ID,Nombre,DNI,Puesto,Salario Bruto,Activo";
  const rows = empleados.map(e =>
    [e.id, e.nombre, e.dni, e.puesto, e.salarioBrutoMensual, e.activo ? "Sí" : "No"].map(escapeCsv).join(",")
  ).join("\n");
  download(`nido-empleados-${new Date().toISOString().slice(0, 10)}.csv`, header + "\n" + rows);
}
