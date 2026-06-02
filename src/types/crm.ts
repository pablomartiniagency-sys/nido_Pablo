// ====== Alumnos / Student CRM ======

export type Alergia = {
  tipo: string; // "alimentaria" | "medicamentosa" | "ambiental"
  desencadenante: string;
  gravedad: "leve" | "moderada" | "grave";
  observaciones?: string;
};

export type Vacuna = {
  nombre: string;
  fecha: string;
  dosis?: string;
};

export type ContactoEmergencia = {
  nombre: string;
  telefono: string;
  relacion: string; // "padre" | "madre" | "abuelo" | "otro"
};

export type DocumentoAlumno = {
  id: string;
  tipo: string; // "autorizacion_imagen" | "ficha_medica" | "matricula" | "otro"
  nombre: string;
  fecha: string;
  url?: string;
};

export type EstadoAlumno = "activo" | "inactivo" | "prematricula" | "baja";

export type AlumnoPerfil = {
  id: string;
  familiaId: string;
  nombre: string;
  fechaNac: string;
  edad: string;
  curso: string; // "lactantes" | "1 año" | "2 años" | "3 años"
  grupo?: string;
  fechaIngreso: string;
  estado: EstadoAlumno;

  // Información médica
  alergias: Alergia[];
  vacunas: Vacuna[];
  medicacionCronica?: string;
  pediatra?: string;
  telefonoPediatra?: string;
  seguroMedico?: string;

  // Contactos
  contactosEmergencia: ContactoEmergencia[];
  autorizadosRecogida: string[]; // nombres de personas autorizadas a recoger

  // Documentación
  documentos: DocumentoAlumno[];
  autorizacionImagen: boolean;
  autorizacionImagenFecha?: string;

  // Observaciones
  observaciones?: string;
  necesidadesEspeciales?: string;
};

// ====== Asistencia ======

export type EstadoAsistencia = "presente" | "ausente" | "justificado" | "tarde";

export type RegistroAsistencia = {
  id: string;
  alumnoId: string;
  fecha: string;
  estado: EstadoAsistencia;
  horaEntrada?: string;
  horaSalida?: string;
  observacion?: string;
  registroPor?: string; // quien registró
};

// ====== Configuración de escuela ======

export const COMUNIDADES_AUTONOMAS = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria",
  "Castilla-La Mancha", "Castilla y León", "Cataluña", "Extremadura", "Galicia",
  "La Rioja", "Madrid", "Murcia", "Navarra", "País Vasco", "Valencia",
] as const;

export type ServicioCatalogo = {
  concepto: string;
  importe: number;
  descripcion: string;
};

export type EscuelaConfig = {
  nombre: string;
  nif: string;
  direccion: string;
  comunidadAutonoma: string;
  telefono: string;
  serviciosCatalogo?: ServicioCatalogo[];
};

// ====== Comercial CRM / Leads ======

export type FuenteLead = "web" | "recomendacion" | "google" | "instagram" | "facebook" | "llamada" | "email" | "otro";

export type EstadoLead = "nuevo" | "contactado" | "visita_programada" | "visita_realizada" | "matriculado" | "perdido" | "no_interesado";

export type Lead = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  nombreHijo?: string;
  edadHijo?: string;
  fuente: FuenteLead;
  estado: EstadoLead;
  fechaContacto: string;
  fechaVisita?: string;
  notas?: string[];
  ultimoContacto?: string;
  assignedTo?: string;
  presupuesto?: number;
  probabilidadCierre?: number; // 0-100
};

export type Oportunidad = {
  id: string;
  leadId: string;
  titulo: string;
  valorEstimado: number;
  probabilidad: number;
  fechaEstimadaCierre: string;
  etapa: "interes" | "visita" | "negociacion" | "cierre";
};
