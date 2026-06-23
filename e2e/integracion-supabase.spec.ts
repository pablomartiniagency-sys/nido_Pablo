/**
 * e2e/integracion-supabase.spec.ts
 * ------------------------------------------------------------------
 * Tests de INTEGRACIÓN REAL contra Supabase (no demo, no mocks).
 *
 * Validan el camino completo que la suite demo NO cubre:
 *   navegador/cliente → PostgREST → exposición de esquema → RLS →
 *   permisos (grants) → traductor `nido` → tablas base en español.
 *
 * Se ejecuta como usuario AUTENTICADO, así que prueba de verdad
 * lo que vivirá la app `nido` en producción.
 *
 * CÓMO EJECUTARLO
 *   1) npm i -D @supabase/supabase-js
 *   2) Exponer el esquema `nido` en Supabase (Settings → API → Exposed schemas).
 *   3) Variables de entorno (NUNCA credenciales en el repo):
 *        export SUPABASE_URL="https://fgqlgehbtjdwcilyroiq.supabase.co"
 *        export SUPABASE_ANON_KEY="<publishable key del proyecto>"
 *        export NIDO_TEST_EMAIL="pablo.garciasalguero@gmail.com"
 *        export NIDO_TEST_PASSWORD="<su contraseña>"
 *   4) npx playwright test e2e/integracion-supabase.spec.ts --workers=1
 *
 * NOTA: usa --workers=1 porque varios tests crean/borran filas reales.
 * Todas las filas de prueba se etiquetan con QA_E2E_ y se limpian solas.
 * ------------------------------------------------------------------
 */
import { test, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_ANON_KEY!;
const EMAIL = process.env.NIDO_TEST_EMAIL!;
const PASSWORD = process.env.NIDO_TEST_PASSWORD!;
const TAG = "QA_E2E_"; // marca para identificar y limpiar filas de prueba

// Volúmenes mínimos sembrados (el suite pasa aunque se añadan más filas)
const BASELINE: Record<string, number> = {
  centros: 1, familias: 80, alumnos: 100, servicios_familia: 152,
  facturas: 93, gastos: 100, empleados: 18, nominas: 90,
  suministros: 60, menus_semanales: 100, comensales_dia: 100,
  incidencias: 100, ai_log: 100,
};

// Columnas exactas que la app espera en cada vista (del schema.sql de nido)
const COLUMNS: Record<string, string[]> = {
  centros: ["id","nombre","nif","iban","bic","creditor_id","owner_id","created_at"],
  familias: ["id","centro_id","nombre","email","telefono","iban","created_at"],
  alumnos: ["id","familia_id","nombre","fecha_nac","alergias"],
  servicios_familia: ["id","familia_id","concepto","importe"],
  facturas: ["id","centro_id","familia_id","numero","periodo","total","estado","dias_impago","created_at"],
  gastos: ["id","centro_id","fecha","proveedor","concepto","importe","iva","categoria","recurrencia","notas","ocr"],
  empleados: ["id","centro_id","nombre","dni","puesto","tipo_contrato","horas_semanales","salario_bruto_mensual","fecha_alta","iban","activo"],
  nominas: ["id","empleado_id","periodo","bruto","irpf","ss_empleado","ss_empresa","neto","pagada"],
  suministros: ["id","centro_id","tipo","proveedor","periodo","consumo","unidad","importe","fecha"],
  menus_semanales: ["id","centro_id","semana","dia","primero","segundo","postre"],
  comensales_dia: ["id","centro_id","fecha","alumno_id","tipo_dieta"],
  incidencias: ["id","centro_id","alumno_id","tipo","descripcion","gravedad","notificada","resuelta","fecha"],
  ai_log: ["id","centro_id","prompt","response","model","tokens","cost_eur","created_at"],
};

function authedClient(): SupabaseClient {
  return createClient(URL, KEY, { db: { schema: "nido" }, auth: { persistSession: false } });
}

let db: SupabaseClient;
let centroId: string;
let familiaId: string;
let alumnoId: string;
let empleadoId: string;

test.beforeAll(async () => {
  for (const [k, v] of Object.entries({ SUPABASE_URL: URL, SUPABASE_ANON_KEY: KEY, NIDO_TEST_EMAIL: EMAIL, NIDO_TEST_PASSWORD: PASSWORD }))
    if (!v) throw new Error(`Falta la variable de entorno ${k}`);

  db = authedClient();
  const { error } = await db.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  expect(error, `Login falló: ${error?.message}`).toBeNull();

  const c = await db.from("centros").select("id").limit(1).single();
  centroId = c.data!.id;
  familiaId = (await db.from("familias").select("id").limit(1).single()).data!.id;
  alumnoId = (await db.from("alumnos").select("id").limit(1).single()).data!.id;
  empleadoId = (await db.from("empleados").select("id").limit(1).single()).data!.id;
});

test.afterAll(async () => {
  // Red de seguridad: borrar cualquier resto de prueba
  if (!db) return;
  await db.from("incidencias").delete().like("descripcion", `${TAG}%`);
  await db.from("comensales_dia").delete().like("tipo_dieta", `${TAG}%`);
  await db.from("ai_log").delete().like("prompt", `${TAG}%`);
  await db.from("menus_semanales").delete().like("primero", `${TAG}%`);
  await db.from("suministros").delete().like("tipo", `${TAG}%`);
  await db.from("nominas").delete().like("periodo", `${TAG}%`);
  await db.from("gastos").delete().like("concepto", `${TAG}%`);
  await db.from("servicios_familia").delete().like("concepto", `${TAG}%`);
  await db.from("facturas").delete().like("numero", `${TAG}%`);
  await db.from("alumnos").delete().like("nombre", `${TAG}%`);
  await db.from("empleados").delete().like("nombre", `${TAG}%`);
  await db.from("familias").delete().like("nombre", `${TAG}%`);
  await db.from("centros").delete().like("nombre", `${TAG}%`);
  await db.auth.signOut();
});

// ─────────────────────────────────────────────────────────────
test.describe("Autenticación y RLS", () => {
  test("el login devuelve sesión válida", async () => {
    const { data } = await db.auth.getSession();
    expect(data.session).not.toBeNull();
  });

  test("sin sesión (anónimo) el RLS no devuelve datos", async () => {
    const anon = authedClient(); // sin signIn
    const { data } = await anon.from("familias").select("*");
    expect(data ?? []).toHaveLength(0); // RLS bloquea al anónimo
  });
});

// ─────────────────────────────────────────────────────────────
test.describe("Estructura y lectura de las 13 vistas", () => {
  for (const [tabla, cols] of Object.entries(COLUMNS)) {
    test(`${tabla}: legible, columnas exactas y volumen mínimo`, async () => {
      const { data, error, count } = await db.from(tabla).select("*", { count: "exact" }).limit(1);
      expect(error, `${tabla} error: ${error?.message}`).toBeNull();
      // columnas exactas
      if (data && data.length) {
        const got = Object.keys(data[0]).sort();
        expect(got).toEqual([...cols].sort());
      }
      // volumen mínimo sembrado
      expect(count ?? 0).toBeGreaterThanOrEqual(BASELINE[tabla]);
    });
  }
});

// ─────────────────────────────────────────────────────────────
test.describe("Mapeo del traductor (nombres traducidos)", () => {
  test("familias expone centro_id (no negocio_id)", async () => {
    const { data } = await db.from("familias").select("*").limit(1).single();
    expect(data).toHaveProperty("centro_id");
    expect(data).not.toHaveProperty("negocio_id");
  });
  test("alumnos expone familia_id (no cuenta_id)", async () => {
    const { data } = await db.from("alumnos").select("*").limit(1).single();
    expect(data).toHaveProperty("familia_id");
    expect(data).not.toHaveProperty("cuenta_id");
  });
  test("comensales_dia expone alumno_id (no sujeto_id)", async () => {
    const { data } = await db.from("comensales_dia").select("*").limit(1).single();
    expect(data).toHaveProperty("alumno_id");
    expect(data).not.toHaveProperty("sujeto_id");
  });
});

// ─────────────────────────────────────────────────────────────
test.describe("CRUD escribible a través del traductor", () => {
  test("familias: crear → leer → editar → borrar (persistente)", async () => {
    const ins = await db.from("familias").insert({ centro_id: centroId, nombre: `${TAG}Familia`, email: "qa@e2e.com" }).select().single();
    expect(ins.error).toBeNull();
    const id = ins.data!.id;
    expect(ins.data!.centro_id).toBe(centroId); // mapeo correcto

    // persistencia: releer con cliente nuevo
    const db2 = authedClient();
    await db2.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    const read = await db2.from("familias").select("*").eq("id", id).single();
    expect(read.data!.nombre).toBe(`${TAG}Familia`);

    const upd = await db.from("familias").update({ telefono: "600999000" }).eq("id", id).select().single();
    expect(upd.data!.telefono).toBe("600999000");

    await db.from("familias").delete().eq("id", id);
    const gone = await db.from("familias").select("id").eq("id", id);
    expect(gone.data ?? []).toHaveLength(0);
  });

  test("alumnos bajo familia real: crear, comprobar join, borrar", async () => {
    const ins = await db.from("alumnos").insert({ familia_id: familiaId, nombre: `${TAG}Alumno`, fecha_nac: "2024-01-01" }).select().single();
    expect(ins.error).toBeNull();
    expect(ins.data!.familia_id).toBe(familiaId);
    await db.from("alumnos").delete().eq("id", ins.data!.id);
  });

  test("facturas: doble mapeo centro_id/familia_id", async () => {
    const ins = await db.from("facturas").insert({ centro_id: centroId, familia_id: familiaId, numero: `${TAG}0001`, total: 300, estado: "pendiente" }).select().single();
    expect(ins.error).toBeNull();
    expect(ins.data!.centro_id).toBe(centroId);
    expect(ins.data!.familia_id).toBe(familiaId);
    await db.from("facturas").delete().eq("id", ins.data!.id);
  });

  // CRUD genérico para el resto de tablas escribibles
  const casos: { tabla: string; row: () => Record<string, unknown>; marca: string }[] = [
    { tabla: "gastos", marca: "concepto", row: () => ({ centro_id: centroId, concepto: `${TAG}Gasto`, importe: 50, categoria: "Material didáctico" }) },
    { tabla: "empleados", marca: "nombre", row: () => ({ centro_id: centroId, nombre: `${TAG}Empleado`, puesto: "Educadora", salario_bruto_mensual: 1500 }) },
    { tabla: "nominas", marca: "periodo", row: () => ({ empleado_id: empleadoId, periodo: `${TAG}06`, bruto: 1500, irpf: 210, ss_empleado: 95.25, neto: 1194.75 }) },
    { tabla: "suministros", marca: "tipo", row: () => ({ centro_id: centroId, tipo: `${TAG}Luz`, importe: 300, periodo: "2026-06" }) },
    { tabla: "menus_semanales", marca: "primero", row: () => ({ centro_id: centroId, semana: "2026-06-01", dia: "Lunes", primero: `${TAG}Crema`, segundo: "Pollo", postre: "Fruta" }) },
    { tabla: "comensales_dia", marca: "tipo_dieta", row: () => ({ centro_id: centroId, fecha: "2026-06-01", alumno_id: alumnoId, tipo_dieta: `${TAG}Normal` }) },
    { tabla: "incidencias", marca: "descripcion", row: () => ({ centro_id: centroId, alumno_id: alumnoId, tipo: "Caída leve", descripcion: `${TAG}leve`, gravedad: "Leve" }) },
    { tabla: "ai_log", marca: "prompt", row: () => ({ centro_id: centroId, prompt: `${TAG}prompt`, response: "ok", model: "gpt-4o-mini", tokens: 100 }) },
    { tabla: "servicios_familia", marca: "concepto", row: () => ({ familia_id: familiaId, concepto: `${TAG}Servicio`, importe: 99 }) },
    { tabla: "centros", marca: "nombre", row: () => ({ nombre: `${TAG}Centro`, nif: "X000" }) },
  ];
  for (const c of casos) {
    test(`${c.tabla}: crear y borrar`, async () => {
      const ins = await db.from(c.tabla).insert(c.row()).select().single();
      expect(ins.error, `${c.tabla} insert: ${ins.error?.message}`).toBeNull();
      const del = await db.from(c.tabla).delete().eq("id", ins.data!.id);
      expect(del.error).toBeNull();
    });
  }
});

// ─────────────────────────────────────────────────────────────
test.describe("Negativas: la base debe rechazar", () => {
  test("familias sin nombre falla (NOT NULL)", async () => {
    const { error } = await db.from("familias").insert({ centro_id: centroId, email: "x@x.com" });
    expect(error).not.toBeNull();
  });
  test("facturas sin numero falla (NOT NULL)", async () => {
    const { error } = await db.from("facturas").insert({ centro_id: centroId, familia_id: familiaId, total: 10 });
    expect(error).not.toBeNull();
  });
  test("familias con centro_id inexistente falla (FK)", async () => {
    const { error } = await db.from("familias").insert({ centro_id: "00000000-0000-0000-0000-000000000000", nombre: `${TAG}FK` });
    expect(error).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe("Rendimiento (vía PostgREST autenticado)", () => {
  test("listar 100 alumnos < 1500ms", async () => {
    const t0 = Date.now();
    const { error } = await db.from("alumnos").select("*").limit(200);
    expect(error).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1500);
  });
});
