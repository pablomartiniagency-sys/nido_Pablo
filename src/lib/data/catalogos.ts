export const CATEGORIAS_GASTO = [
  { value: "alimentacion", label: "Alimentación", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "material", label: "Material didáctico", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "mantenimiento", label: "Mantenimiento", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "suministros", label: "Suministros", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "personal", label: "Personal", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "seguros", label: "Seguros", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "limpieza", label: "Limpieza", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { value: "alquiler", label: "Alquiler", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "gestoria", label: "Gestoría", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "marketing", label: "Marketing", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "formacion", label: "Formación", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "transporte", label: "Transporte", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "salud", label: "Salud", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "ocio", label: "Ocio / Extraescolares", color: "bg-lime-50 text-lime-700 border-lime-200" },
  { value: "otros", label: "Otros", color: "bg-gray-50 text-ink-500 border-gray-200" },
] as const;

export const SERVICIOS_CATALOGO = [
  { concepto: "Matrícula curso escolar", importe: 150, descripcion: "Pago único anual por alumno" },
  { concepto: "Mensualidad completa (8:00-17:00)", importe: 420, descripcion: "Horario completo con comedor" },
  { concepto: "Mensualidad media jornada (8:00-13:00)", importe: 320, descripcion: "Horario de mañana sin comedor" },
  { concepto: "Comedor escolar", importe: 85, descripcion: "Servicio de comedor mensual" },
  { concepto: "Ampliación horaria mañana (7:30-8:00)", importe: 30, descripcion: "Entrada temprano" },
  { concepto: "Ampliación horaria tarde (17:00-18:00)", importe: 40, descripcion: "Salida tarde" },
  { concepto: "Extraescolar: inglés", importe: 35, descripcion: "Clase semanal de inglés" },
  { concepto: "Extraescolar: psicomotricidad", importe: 30, descripcion: "Clase semanal de psicomotricidad" },
  { concepto: "Extraescolar: música", importe: 30, descripcion: "Clase semanal de música" },
  { concepto: "Lactantes (0-12 meses)", importe: 380, descripcion: "Bebés — precio especial" },
  { concepto: "Pañales e higiene", importe: 25, descripcion: "Pañales, toallitas, cremas mensual" },
  { concepto: "Material didáctico", importe: 20, descripcion: "Material escolar mensual" },
] as const;

export const ESCUELA_DEMO = {
  nombre: "Escuela Infantil Arcoíris",
  nif: "B-87654321",
  iban: "ES9121000418450200051332",
  bic: "CAIXESBBXXX",
  creditorId: "ES3200001234567890",
};
