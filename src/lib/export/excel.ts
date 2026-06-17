import * as XLSX from "xlsx";

function download(filename: string, wb: XLSX.WorkBook) {
  XLSX.writeFile(wb, filename);
}

export function exportFamiliasExcel(
  familias: { id: string; nombre: string; email: string; telefono: string; iban: string; alumnos: string[] }[],
) {
  const wb = XLSX.utils.book_new();
  const data = familias.map(f => ({
    ID: f.id, Nombre: f.nombre, Email: f.email,
    Teléfono: f.telefono, IBAN: f.iban,
    "Alumno 1": f.alumnos[0] || "", "Alumno 2": f.alumnos[1] || "",
    "Alumno 3": f.alumnos[2] || "", "Alumno 4": f.alumnos[3] || "",
    "Alumno 5": f.alumnos[4] || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Familias");
  download(`nido-familias-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}

export function exportFacturasExcel(
  facturas: { id: string; numero: string; familia: string; periodo: string; total: number; estado: string }[],
) {
  const wb = XLSX.utils.book_new();
  const data = facturas.map(f => ({ ID: f.id, Número: f.numero, Cliente: f.familia, Período: f.periodo, Total: f.total, Estado: f.estado }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Facturas");
  download(`nido-facturas-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}

export function exportGastosExcel(
  gastos: { id: string; fecha: string; proveedor: string; concepto: string; importe: number; categoria: string }[],
) {
  const wb = XLSX.utils.book_new();
  const data = gastos.map(g => ({ ID: g.id, Fecha: g.fecha, Proveedor: g.proveedor, Concepto: g.concepto, Importe: g.importe, Categoría: g.categoria }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Gastos");
  download(`nido-gastos-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}

export function exportAlumnosExcel(
  alumnos: { id: string; nombre: string; fechaNac: string; curso: string; estado: string; alergias: string }[],
) {
  const wb = XLSX.utils.book_new();
  const data = alumnos.map(a => ({ ID: a.id, Nombre: a.nombre, "Fecha Nac.": a.fechaNac, Curso: a.curso, Estado: a.estado, Alergias: a.alergias }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
  download(`nido-alumnos-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}

export function exportLeadsExcel(
  leads: { id: string; nombre: string; email: string; telefono: string; fuente: string; estado: string; fechaContacto: string }[],
) {
  const wb = XLSX.utils.book_new();
  const data = leads.map(l => ({ ID: l.id, Nombre: l.nombre, Email: l.email, Teléfono: l.telefono, Fuente: l.fuente, Estado: l.estado, "Fecha Contacto": l.fechaContacto }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  download(`nido-leads-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}

export function exportEmpleadosExcel(
  empleados: { id: string; nombre: string; dni: string; puesto: string; salarioBrutoMensual: number; activo: boolean }[],
) {
  const wb = XLSX.utils.book_new();
  const data = empleados.map(e => ({ ID: e.id, Nombre: e.nombre, DNI: e.dni, Puesto: e.puesto, "Salario Bruto": e.salarioBrutoMensual, Activo: e.activo ? "Sí" : "No" }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Empleados");
  download(`nido-empleados-${new Date().toISOString().slice(0, 10)}.xlsx`, wb);
}
