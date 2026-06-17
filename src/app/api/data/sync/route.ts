import { NextRequest, NextResponse } from "next/server";
import { getIdentityAdminClient } from "@/lib/supabase-identity-admin";
import { getDataAdminClient } from "@/lib/supabase-data";

interface StorePayload {
  familias: any[]; facturas: any[]; gastos: any[]; empleados: any[];
  nominas: any[]; suministros: any[]; menu: any; incidencias: any[];
  alumnos: any[]; asistencia: any[]; leads: any[]; oportunidades: any[];
  configuracion: any; tareas: any[]; cargosPendientes: any[];
}

async function verifyUser(req: NextRequest): Promise<{ userId: string } | { error: string; status: number }> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { error: "No autorizado", status: 401 };
  const token = auth.slice(7);
  const identityAdmin = getIdentityAdminClient();
  if (!identityAdmin) return { error: "Error de configuración de auth", status: 500 };
  const { data, error } = await identityAdmin.auth.getUser(token);
  if (error || !data.user) return { error: "Token inválido", status: 401 };
  return { userId: data.user.id };
}

const TABLES = [
  "nido_familias", "nido_facturas", "nido_gastos", "nido_empleados",
  "nido_nominas", "nido_suministros", "nido_menu_semanal", "nido_incidencias",
  "nido_alumnos", "nido_asistencia", "nido_leads", "nido_oportunidades",
  "nido_configuracion", "nido_tareas", "nido_cargos_pendientes",
] as const;

export async function GET(req: NextRequest) {
  const verified = await verifyUser(req);
  if ("error" in verified) return NextResponse.json({ error: verified.error }, { status: verified.status });

  const { userId } = verified;
  const sb = getDataAdminClient();
  if (!sb) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 });

  try {
    const [
      familias, facturas, gastos, empleados, nominas, suministros,
      menuRows, incidencias, alumnos, asistencia, leads, oportunidades,
      configRows, tareas, cargos,
    ] = await Promise.all([
      sb.from("nido_familias").select("*").eq("user_id", userId),
      sb.from("nido_facturas").select("*").eq("user_id", userId),
      sb.from("nido_gastos").select("*").eq("user_id", userId),
      sb.from("nido_empleados").select("*").eq("user_id", userId),
      sb.from("nido_nominas").select("*").eq("user_id", userId),
      sb.from("nido_suministros").select("*").eq("user_id", userId),
      sb.from("nido_menu_semanal").select("*").eq("user_id", userId),
      sb.from("nido_incidencias").select("*").eq("user_id", userId),
      sb.from("nido_alumnos").select("*").eq("user_id", userId),
      sb.from("nido_asistencia").select("*").eq("user_id", userId),
      sb.from("nido_leads").select("*").eq("user_id", userId),
      sb.from("nido_oportunidades").select("*").eq("user_id", userId),
      sb.from("nido_configuracion").select("*").eq("user_id", userId),
      sb.from("nido_tareas").select("*").eq("user_id", userId),
      sb.from("nido_cargos_pendientes").select("*").eq("user_id", userId),
    ]);

    const data: StorePayload = {
      familias: (familias.data || []).map(mapFamilia),
      facturas: (facturas.data || []).map(mapFactura),
      gastos: (gastos.data || []).map(mapGasto),
      empleados: (empleados.data || []).map(mapEmpleado),
      nominas: (nominas.data || []).map(mapNomina),
      suministros: (suministros.data || []).map(mapSuministro),
      menu: buildMenu(menuRows.data || []),
      incidencias: (incidencias.data || []).map(mapIncidencia),
      alumnos: (alumnos.data || []).map(mapAlumno),
      asistencia: (asistencia.data || []).map(mapAsistencia),
      leads: (leads.data || []).map(mapLead),
      oportunidades: (oportunidades.data || []).map(mapOportunidad),
      configuracion: (configRows.data?.[0] ? mapConfiguracion(configRows.data[0]) : {}),
      tareas: (tareas.data || []).map(mapTarea),
      cargosPendientes: (cargos.data || []).map(mapCargo),
    };

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const verified = await verifyUser(req);
  if ("error" in verified) return NextResponse.json({ error: verified.error }, { status: verified.status });

  const { userId } = verified;
  const sb = getDataAdminClient();
  if (!sb) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 });

  try {
    const body: StorePayload = await req.json();

    const menuRows = body.menu ? flattenMenu(body.menu, userId) : [];

    const [
      configRow,
    ] = await Promise.all([
      body.configuracion ? Promise.resolve(body.configuracion) : Promise.resolve(null),
    ]);

    const operations = [
      replaceData(sb, "nido_familias", userId, (body.familias || []).map(r => mapFamiliaDb(r, userId))),
      replaceData(sb, "nido_facturas", userId, (body.facturas || []).map(r => mapFacturaDb(r, userId))),
      replaceData(sb, "nido_gastos", userId, (body.gastos || []).map(r => mapGastoDb(r, userId))),
      replaceData(sb, "nido_empleados", userId, (body.empleados || []).map(r => mapEmpleadoDb(r, userId))),
      replaceData(sb, "nido_nominas", userId, (body.nominas || []).map(r => mapNominaDb(r, userId))),
      replaceData(sb, "nido_suministros", userId, (body.suministros || []).map(r => mapSuministroDb(r, userId))),
      replaceData(sb, "nido_menu_semanal", userId, menuRows),
      replaceData(sb, "nido_incidencias", userId, (body.incidencias || []).map(r => mapIncidenciaDb(r, userId))),
      replaceData(sb, "nido_alumnos", userId, (body.alumnos || []).map(r => mapAlumnoDb(r, userId))),
      replaceData(sb, "nido_asistencia", userId, (body.asistencia || []).map(r => mapAsistenciaDb(r, userId))),
      replaceData(sb, "nido_leads", userId, (body.leads || []).map(r => mapLeadDb(r, userId))),
      replaceData(sb, "nido_oportunidades", userId, (body.oportunidades || []).map(r => mapOportunidadDb(r, userId))),
      replaceData(sb, "nido_tareas", userId, (body.tareas || []).map(r => mapTareaDb(r, userId))),
      replaceData(sb, "nido_cargos_pendientes", userId, (body.cargosPendientes || []).map(r => mapCargoDb(r, userId))),
    ];

    if (configRow) {
      operations.push(
        replaceData(sb, "nido_configuracion", userId, [mapConfiguracionDb(configRow, userId)])
      );
    }

    await Promise.all(operations);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function replaceData(sb: any, table: string, userId: string, rows: any[]) {
  if (!rows.length) {
    await sb.from(table).delete().eq("user_id", userId);
    return;
  }
  await sb.from(table).delete().eq("user_id", userId);
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await sb.from(table).insert(batch);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

// ── Mappers: DB → App ──

function mapFamilia(r: any) {
  return { id: r.id, nombre: r.nombre, email: r.email || "", telefono: r.telefono || "", iban: r.iban || "", alumnos: r.alumnos || [], servicios: r.servicios || [] };
}
function mapFactura(r: any) {
  return { id: r.id, numero: r.numero, familiaId: r.familia_id, familia: r.familia, periodo: r.periodo, items: r.items || [], total: r.total, estado: r.estado, diasImpago: r.dias_impago ?? 0 };
}
function mapGasto(r: any) {
  return { id: r.id, fecha: r.fecha, proveedor: r.proveedor, concepto: r.concepto, importe: r.importe, iva: r.iva, categoria: r.categoria, recurrencia: r.recurrencia || "puntual", notas: r.notas, ocr: !!r.ocr, archivoOriginal: r.archivo_original, ocrRef: r.ocr_ref || undefined };
}
function mapEmpleado(r: any) {
  return { id: r.id, nombre: r.nombre, dni: r.dni || "", puesto: r.puesto || "", tipoContrato: r.tipo_contrato || "indefinido", horasSemanales: r.horas_semanales ?? 40, salarioBrutoMensual: r.salario_bruto_mensual, fechaAlta: r.fecha_alta || "", iban: r.iban || "", activo: !!r.activo };
}
function mapNomina(r: any) {
  return { id: r.id, empleadoId: r.empleado_id, periodo: r.periodo, bruto: r.bruto, irpf: r.irpf, ssEmpleado: r.ss_empleado, ssEmpresa: r.ss_empresa, neto: r.neto, pagada: !!r.pagada };
}
function mapSuministro(r: any) {
  return { id: r.id, tipo: r.tipo, proveedor: r.proveedor || "", periodo: r.periodo || "", consumo: r.consumo ?? 0, unidad: r.unidad || "", importe: r.importe, fecha: r.fecha || "" };
}
function mapIncidencia(r: any) {
  return { id: r.id, alumno: r.alumno || "", tipo: r.tipo || "otro", descripcion: r.descripcion || "", gravedad: r.gravedad || "leve", notificada: !!r.notificada, resuelta: !!r.resuelta, fecha: r.fecha || "" };
}
function mapAlumno(r: any) {
  return { id: r.id, familiaId: r.familia_id, nombre: r.nombre, fechaNac: r.fecha_nac || "", edad: r.edad || "", curso: r.curso || "", grupo: r.grupo, fechaIngreso: r.fecha_ingreso || "", estado: r.estado || "activo", alergias: r.alergias || [], vacunas: r.vacunas || [], medicacionCronica: r.medicacion_cronica, pediatra: r.pediatra, telefonoPediatra: r.telefono_pediatra, seguroMedico: r.seguro_medico, contactosEmergencia: r.contactos_emergencia || [], autorizadosRecogida: r.autorizados_recogida || [], documentos: r.documentos || [], autorizacionImagen: !!r.autorizacion_imagen, autorizacionImagenFecha: r.autorizacion_imagen_fecha, observaciones: r.observaciones, necesidadesEspeciales: r.necesidades_especiales };
}
function mapAsistencia(r: any) {
  return { id: r.id, alumnoId: r.alumno_id, fecha: r.fecha, estado: r.estado || "presente", horaEntrada: r.hora_entrada, horaSalida: r.hora_salida, observacion: r.observacion, registroPor: r.registro_por };
}
function mapLead(r: any) {
  return { id: r.id, nombre: r.nombre, email: r.email || "", telefono: r.telefono || "", nombreHijo: r.nombre_hijo, edadHijo: r.edad_hijo, fuente: r.fuente || "otro", estado: r.estado || "nuevo", fechaContacto: r.fecha_contacto || "", fechaVisita: r.fecha_visita, notas: r.notas || [], ultimoContacto: r.ultimo_contacto, assignedTo: r.assigned_to, presupuesto: r.presupuesto, probabilidadCierre: r.probabilidad_cierre };
}
function mapOportunidad(r: any) {
  return { id: r.id, leadId: r.lead_id, titulo: r.titulo, valorEstimado: r.valor_estimado, probabilidad: r.probabilidad, fechaEstimadaCierre: r.fecha_estimada_cierre, etapa: r.etapa || "interes" };
}
function mapConfiguracion(r: any) {
  return { nombre: r.nombre || "", nif: r.nif || "", direccion: r.direccion || "", comunidadAutonoma: r.comunidad_autonoma || "", telefono: r.telefono || "", serviciosCatalogo: r.servicios_catalogo || [] };
}
function mapTarea(r: any) {
  return { id: r.id, titulo: r.titulo, descripcion: r.descripcion, fecha: r.fecha, completada: !!r.completada, creadaPor: r.creada_por || "manual", createdAt: r.created_at || "" };
}
function mapCargo(r: any) {
  return { id: r.id, familiaId: r.familia_id, alumnoId: r.alumno_id, alumnoNombre: r.alumno_nombre, concepto: r.concepto, importe: r.importe, fechaEmision: r.fecha_emision, fechaVencimiento: r.fecha_vencimiento, estado: r.estado || "pendiente", tipo: r.tipo || "cuota", notas: r.notas };
}

function buildMenu(rows: any[]): any {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  const menu: any = {};
  for (const dia of dias) menu[dia] = { primero: "", segundo: "", postre: "" };
  for (const r of rows) {
    if (menu[r.dia]) menu[r.dia] = { primero: r.primero || "", segundo: r.segundo || "", postre: r.postre || "" };
  }
  return menu;
}

// ── Mappers: App → DB ──

function mapFamiliaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, nombre: r.nombre, email: r.email || "", telefono: r.telefono || "", iban: r.iban || "", alumnos: r.alumnos || [], servicios: r.servicios || [] };
}
function mapFacturaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, numero: r.numero, familia_id: r.familiaId, familia: r.familia, periodo: r.periodo, items: r.items || [], total: r.total, estado: r.estado, dias_impago: r.diasImpago ?? 0 };
}
function mapGastoDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, fecha: r.fecha, proveedor: r.proveedor, concepto: r.concepto, importe: r.importe, iva: r.iva, categoria: r.categoria, recurrencia: r.recurrencia || "puntual", notas: r.notas, ocr: r.ocr ? 1 : 0, archivo_original: r.archivoOriginal, ocr_ref: r.ocrRef };
}
function mapEmpleadoDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, nombre: r.nombre, dni: r.dni || "", puesto: r.puesto || "", tipo_contrato: r.tipoContrato || "indefinido", horas_semanales: r.horasSemanales ?? 40, salario_bruto_mensual: r.salarioBrutoMensual, fecha_alta: r.fechaAlta || "", iban: r.iban || "", activo: r.activo ? 1 : 0 };
}
function mapNominaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, empleado_id: r.empleadoId, periodo: r.periodo, bruto: r.bruto, irpf: r.irpf, ss_empleado: r.ssEmpleado, ss_empresa: r.ssEmpresa, neto: r.neto, pagada: r.pagada ? 1 : 0 };
}
function mapSuministroDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, tipo: r.tipo, proveedor: r.proveedor || "", periodo: r.periodo || "", consumo: r.consumo ?? 0, unidad: r.unidad || "", importe: r.importe, fecha: r.fecha || "" };
}
function mapIncidenciaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, alumno: r.alumno || "", tipo: r.tipo || "otro", descripcion: r.descripcion || "", gravedad: r.gravedad || "leve", notificada: r.notificada ? 1 : 0, resuelta: r.resuelta ? 1 : 0, fecha: r.fecha || "" };
}
function mapAlumnoDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, familia_id: r.familiaId, nombre: r.nombre, fecha_nac: r.fechaNac || "", edad: r.edad || "", curso: r.curso || "", grupo: r.grupo, fecha_ingreso: r.fechaIngreso || "", estado: r.estado || "activo", alergias: r.alergias || [], vacunas: r.vacunas || [], medicacion_cronica: r.medicacionCronica, pediatra: r.pediatra, telefono_pediatra: r.telefonoPediatra, seguro_medico: r.seguroMedico, contactos_emergencia: r.contactosEmergencia || [], autorizados_recogida: r.autorizadosRecogida || [], documentos: r.documentos || [], autorizacion_imagen: r.autorizacionImagen ? 1 : 0, autorizacion_imagen_fecha: r.autorizacionImagenFecha, observaciones: r.observaciones, necesidades_especiales: r.necesidadesEspeciales };
}
function mapAsistenciaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, alumno_id: r.alumnoId, fecha: r.fecha, estado: r.estado || "presente", hora_entrada: r.horaEntrada, hora_salida: r.horaSalida, observacion: r.observacion, registro_por: r.registroPor };
}
function mapLeadDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, nombre: r.nombre, email: r.email || "", telefono: r.telefono || "", nombre_hijo: r.nombreHijo, edad_hijo: r.edadHijo, fuente: r.fuente || "otro", estado: r.estado || "nuevo", fecha_contacto: r.fechaContacto || "", fecha_visita: r.fechaVisita, notas: r.notas || [], ultimo_contacto: r.ultimoContacto, assigned_to: r.assignedTo, presupuesto: r.presupuesto, probabilidad_cierre: r.probabilidadCierre };
}
function mapOportunidadDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, lead_id: r.leadId, titulo: r.titulo, valor_estimado: r.valorEstimado, probabilidad: r.probabilidad, fecha_estimada_cierre: r.fechaEstimadaCierre, etapa: r.etapa || "interes" };
}
function mapConfiguracionDb(r: any, userId: string) {
  return { id: `config-${userId}`, user_id: userId, nombre: r.nombre || "", nif: r.nif || "", direccion: r.direccion || "", comunidad_autonoma: r.comunidadAutonoma || "", telefono: r.telefono || "", servicios_catalogo: r.serviciosCatalogo || [] };
}
function mapTareaDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, titulo: r.titulo, descripcion: r.descripcion, fecha: r.fecha, completada: r.completada ? 1 : 0, creada_por: r.creadaPor || "manual", created_at: r.createdAt || new Date().toISOString() };
}
function mapCargoDb(r: any, userId: string) {
  return { id: r.id, user_id: userId, familia_id: r.familiaId, alumno_id: r.alumnoId, alumno_nombre: r.alumnoNombre, concepto: r.concepto, importe: r.importe, fecha_emision: r.fechaEmision, fecha_vencimiento: r.fechaVencimiento, estado: r.estado || "pendiente", tipo: r.tipo || "cuota", notas: r.notas };
}

function flattenMenu(menu: any, userId: string) {
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes"];
  return dias.map(dia => ({
    id: `menu-${userId}-${dia}`,
    user_id: userId,
    dia,
    primero: menu[dia]?.primero || "",
    segundo: menu[dia]?.segundo || "",
    postre: menu[dia]?.postre || "",
  }));
}
