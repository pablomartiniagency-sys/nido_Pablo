export type EstadoFactura = "borrador" | "enviada" | "pagada" | "impago" | "anulada";
export type Servicio = { concepto: string; importe: number; iva?: number };

export type Familia = {
  id: string; nombre: string; email: string; telefono: string; iban: string;
  alumnos: string[]; servicios: Servicio[];
};

export type Factura = {
  id: string; numero: string; familiaId: string; familia: string; periodo: string;
  items: Servicio[]; total: number; estado: EstadoFactura; diasImpago: number;
};

export type CategoriaGasto =
  | "alimentacion" | "material" | "mantenimiento" | "suministros"
  | "personal" | "seguros" | "limpieza" | "alquiler"
  | "gestoria" | "marketing" | "formacion" | "transporte"
  | "salud" | "ocio" | "otros";

export type Recurrencia = "puntual" | "mensual" | "trimestral" | "anual";

export type Gasto = {
  id: string; fecha: string; proveedor: string; concepto: string;
  importe: number; iva: number; categoria: CategoriaGasto;
  recurrencia: Recurrencia;   notas?: string; ocr?: boolean; archivoOriginal?: string; ocrRef?: { proveedor: string; fecha: string; importe: number; iva: number; categoria: string; textoExtraido: string; fechaOCR: string; };
};

export type Empleado = {
  id: string; nombre: string; dni: string; puesto: string;
  tipoContrato: "indefinido" | "temporal" | "practicas" | "fijo_discontinuo";
  horasSemanales: number; salarioBrutoMensual: number;
  fechaAlta: string; iban: string; activo: boolean;
};

export type Nomina = {
  id: string; empleadoId: string; periodo: string;
  bruto: number; irpf: number; ssEmpleado: number; ssEmpresa: number;
  neto: number; pagada: boolean;
};

export type SuministroFactura = {
  id: string; tipo: "electricidad"|"agua"|"gas"|"internet"|"telefonia"|"otro";
  proveedor: string; periodo: string; consumo: number; unidad: string;
  importe: number; fecha: string;
};

export type MenuDia = { primero: string; segundo: string; postre: string };
export type MenuSemanal = Record<"lunes"|"martes"|"miercoles"|"jueves"|"viernes", MenuDia>;

export type Incidencia = {
  id: string; alumno: string;
  tipo: "caida"|"fiebre"|"alergia"|"conflicto"|"otro";
  descripcion: string; gravedad: "leve"|"moderada"|"grave";
  notificada: boolean; resuelta: boolean; fecha: string;
};

export type Tarea = {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  completada: boolean;
  creadaPor: "ia" | "manual";
  createdAt: string;
};

export type EstadoCargo = "pendiente" | "pagado" | "anulado";

export type CargoPendiente = {
  id: string;
  familiaId: string;
  alumnoId: string;
  alumnoNombre: string;
  concepto: string;
  importe: number;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: EstadoCargo;
  tipo: "cuota" | "material" | "extraescolar" | "comedor" | "matricula" | "otro";
  notas?: string;
};

export type { ServicioCatalogo } from "./crm";
