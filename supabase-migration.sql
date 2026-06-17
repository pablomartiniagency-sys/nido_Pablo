-- Migración: tablas de datos de negocio para Nido
-- Ejecutar en el SQL Editor del proyecto legacy: https://supabase.com/dashboard/project/fgqlgehbtjdwcilyroiq/sql/new

-- Cada tabla tiene user_id TEXT para filtrar por usuario inquilino.
-- id TEXT es el mismo ID que genera la app (genId), único por tabla.

CREATE TABLE IF NOT EXISTS nido_familias (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  iban TEXT NOT NULL DEFAULT '',
  alumnos JSONB NOT NULL DEFAULT '[]',
  servicios JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_nido_familias_user ON nido_familias(user_id);

CREATE TABLE IF NOT EXISTS nido_facturas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  numero TEXT NOT NULL,
  familia_id TEXT NOT NULL,
  familia TEXT NOT NULL,
  periodo TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total REAL NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador',
  dias_impago INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_nido_facturas_user ON nido_facturas(user_id);

CREATE TABLE IF NOT EXISTS nido_gastos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fecha TEXT NOT NULL,
  proveedor TEXT NOT NULL,
  concepto TEXT NOT NULL,
  importe REAL NOT NULL DEFAULT 0,
  iva REAL NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  recurrencia TEXT NOT NULL DEFAULT 'puntual',
  notas TEXT,
  ocr INTEGER NOT NULL DEFAULT 0,
  archivo_original TEXT,
  ocr_ref JSONB
);
CREATE INDEX IF NOT EXISTS idx_nido_gastos_user ON nido_gastos(user_id);

CREATE TABLE IF NOT EXISTS nido_empleados (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  dni TEXT NOT NULL DEFAULT '',
  puesto TEXT NOT NULL DEFAULT '',
  tipo_contrato TEXT NOT NULL DEFAULT 'indefinido',
  horas_semanales REAL NOT NULL DEFAULT 40,
  salario_bruto_mensual REAL NOT NULL DEFAULT 0,
  fecha_alta TEXT NOT NULL DEFAULT '',
  iban TEXT NOT NULL DEFAULT '',
  activo INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_nido_empleados_user ON nido_empleados(user_id);

CREATE TABLE IF NOT EXISTS nido_nominas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  empleado_id TEXT NOT NULL,
  periodo TEXT NOT NULL,
  bruto REAL NOT NULL DEFAULT 0,
  irpf REAL NOT NULL DEFAULT 0,
  ss_empleado REAL NOT NULL DEFAULT 0,
  ss_empresa REAL NOT NULL DEFAULT 0,
  neto REAL NOT NULL DEFAULT 0,
  pagada INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_nido_nominas_user ON nido_nominas(user_id);

CREATE TABLE IF NOT EXISTS nido_suministros (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  proveedor TEXT NOT NULL DEFAULT '',
  periodo TEXT NOT NULL DEFAULT '',
  consumo REAL NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT '',
  importe REAL NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_nido_suministros_user ON nido_suministros(user_id);

CREATE TABLE IF NOT EXISTS nido_menu_semanal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dia TEXT NOT NULL,
  primero TEXT NOT NULL DEFAULT '',
  segundo TEXT NOT NULL DEFAULT '',
  postre TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_nido_menu_user ON nido_menu_semanal(user_id);

CREATE TABLE IF NOT EXISTS nido_incidencias (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alumno TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'otro',
  descripcion TEXT NOT NULL DEFAULT '',
  gravedad TEXT NOT NULL DEFAULT 'leve',
  notificada INTEGER NOT NULL DEFAULT 0,
  resuelta INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_nido_incidencias_user ON nido_incidencias(user_id);

CREATE TABLE IF NOT EXISTS nido_alumnos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  familia_id TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL,
  fecha_nac TEXT NOT NULL DEFAULT '',
  edad TEXT NOT NULL DEFAULT '',
  curso TEXT NOT NULL DEFAULT '',
  grupo TEXT,
  fecha_ingreso TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activo',
  alergias JSONB NOT NULL DEFAULT '[]',
  vacunas JSONB NOT NULL DEFAULT '[]',
  medicacion_cronica TEXT,
  pediatra TEXT,
  telefono_pediatra TEXT,
  seguro_medico TEXT,
  contactos_emergencia JSONB NOT NULL DEFAULT '[]',
  autorizados_recogida JSONB NOT NULL DEFAULT '[]',
  documentos JSONB NOT NULL DEFAULT '[]',
  autorizacion_imagen INTEGER NOT NULL DEFAULT 0,
  autorizacion_imagen_fecha TEXT,
  observaciones TEXT,
  necesidades_especiales TEXT
);
CREATE INDEX IF NOT EXISTS idx_nido_alumnos_user ON nido_alumnos(user_id);

CREATE TABLE IF NOT EXISTS nido_asistencia (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alumno_id TEXT NOT NULL,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'presente',
  hora_entrada TEXT,
  hora_salida TEXT,
  observacion TEXT,
  registro_por TEXT
);
CREATE INDEX IF NOT EXISTS idx_nido_asistencia_user ON nido_asistencia(user_id);

CREATE TABLE IF NOT EXISTS nido_leads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  nombre_hijo TEXT,
  edad_hijo TEXT,
  fuente TEXT NOT NULL DEFAULT 'otro',
  estado TEXT NOT NULL DEFAULT 'nuevo',
  fecha_contacto TEXT NOT NULL DEFAULT '',
  fecha_visita TEXT,
  notas JSONB DEFAULT '[]',
  ultimo_contacto TEXT,
  assigned_to TEXT,
  presupuesto REAL,
  probabilidad_cierre REAL
);
CREATE INDEX IF NOT EXISTS idx_nido_leads_user ON nido_leads(user_id);

CREATE TABLE IF NOT EXISTS nido_oportunidades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  valor_estimado REAL NOT NULL DEFAULT 0,
  probabilidad REAL NOT NULL DEFAULT 0,
  fecha_estimada_cierre TEXT NOT NULL DEFAULT '',
  etapa TEXT NOT NULL DEFAULT 'interes'
);
CREATE INDEX IF NOT EXISTS idx_nido_oportunidades_user ON nido_oportunidades(user_id);

CREATE TABLE IF NOT EXISTS nido_configuracion (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  nif TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  comunidad_autonoma TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  servicios_catalogo JSONB DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_nido_configuracion_user ON nido_configuracion(user_id);

CREATE TABLE IF NOT EXISTS nido_tareas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TEXT,
  completada INTEGER NOT NULL DEFAULT 0,
  creada_por TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS idx_nido_tareas_user ON nido_tareas(user_id);

CREATE TABLE IF NOT EXISTS nido_cargos_pendientes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  familia_id TEXT NOT NULL DEFAULT '',
  alumno_id TEXT NOT NULL DEFAULT '',
  alumno_nombre TEXT NOT NULL DEFAULT '',
  concepto TEXT NOT NULL DEFAULT '',
  importe REAL NOT NULL DEFAULT 0,
  fecha_emision TEXT NOT NULL DEFAULT '',
  fecha_vencimiento TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  tipo TEXT NOT NULL DEFAULT 'cuota',
  notas TEXT
);
CREATE INDEX IF NOT EXISTS idx_nido_cargos_user ON nido_cargos_pendientes(user_id);
