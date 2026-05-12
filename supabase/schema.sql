-- Nido — Supabase Schema
-- Multi-tenant: cada centro tiene su propio dataset, RLS garantiza aislamiento

create table if not exists centros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, nif text, iban text, bic text, creditor_id text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists familias (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  nombre text not null, email text, telefono text, iban text,
  created_at timestamptz default now()
);

create table if not exists alumnos (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid references familias(id) on delete cascade,
  nombre text not null, fecha_nac date, alergias text[]
);

create table if not exists servicios_familia (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid references familias(id) on delete cascade,
  concepto text not null, importe numeric(10,2) not null
);

create table if not exists facturas (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  familia_id uuid references familias(id),
  numero text not null, periodo text, total numeric(10,2),
  estado text default 'borrador', dias_impago int default 0,
  created_at timestamptz default now()
);

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  fecha date, proveedor text, concepto text,
  importe numeric(10,2), iva numeric(5,2),
  categoria text, recurrencia text, notas text, ocr boolean default false
);

create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  nombre text, dni text, puesto text,
  tipo_contrato text, horas_semanales int,
  salario_bruto_mensual numeric(10,2),
  fecha_alta date, iban text, activo boolean default true
);

create table if not exists nominas (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid references empleados(id) on delete cascade,
  periodo text, bruto numeric(10,2), irpf numeric(10,2),
  ss_empleado numeric(10,2), ss_empresa numeric(10,2),
  neto numeric(10,2), pagada boolean default false
);

create table if not exists suministros (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  tipo text, proveedor text, periodo text,
  consumo numeric(10,2), unidad text, importe numeric(10,2), fecha date
);

create table if not exists menus_semanales (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  semana date, dia text, primero text, segundo text, postre text
);

create table if not exists comensales_dia (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  fecha date, alumno_id uuid references alumnos(id), tipo_dieta text
);

create table if not exists incidencias (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  alumno_id uuid references alumnos(id),
  tipo text, descripcion text, gravedad text,
  notificada boolean default false, resuelta boolean default false,
  fecha timestamptz default now()
);

create table if not exists ai_log (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid references centros(id) on delete cascade,
  prompt text, response text, model text, tokens int, cost_eur numeric(10,4),
  created_at timestamptz default now()
);

-- RLS — multi-tenant por owner del centro
create or replace function is_owner_of_centro(c_id uuid) returns boolean
language sql security definer as $$
  select exists(select 1 from centros where id = c_id and owner_id = auth.uid());
$$;

alter table centros enable row level security;
drop policy if exists "centros_owner" on centros;
create policy "centros_owner" on centros using (owner_id = auth.uid());

alter table familias enable row level security;
drop policy if exists "familias_isolate" on familias;
create policy "familias_isolate" on familias using (is_owner_of_centro(centro_id));

alter table alumnos enable row level security;
drop policy if exists "alumnos_isolate" on alumnos;
create policy "alumnos_isolate" on alumnos using (
  exists(select 1 from familias where familias.id = alumnos.familia_id and is_owner_of_centro(familias.centro_id))
);

alter table facturas enable row level security;
drop policy if exists "facturas_isolate" on facturas;
create policy "facturas_isolate" on facturas using (is_owner_of_centro(centro_id));

alter table gastos enable row level security;
drop policy if exists "gastos_isolate" on gastos;
create policy "gastos_isolate" on gastos using (is_owner_of_centro(centro_id));

alter table empleados enable row level security;
drop policy if exists "empleados_isolate" on empleados;
create policy "empleados_isolate" on empleados using (is_owner_of_centro(centro_id));

alter table nominas enable row level security;
drop policy if exists "nominas_isolate" on nominas;
create policy "nominas_isolate" on nominas using (
  exists(select 1 from empleados where empleados.id = nominas.empleado_id and is_owner_of_centro(empleados.centro_id))
);

alter table suministros enable row level security;
drop policy if exists "suministros_isolate" on suministros;
create policy "suministros_isolate" on suministros using (is_owner_of_centro(centro_id));

alter table menus_semanales enable row level security;
drop policy if exists "menus_isolate" on menus_semanales;
create policy "menus_isolate" on menus_semanales using (is_owner_of_centro(centro_id));

alter table comensales_dia enable row level security;
drop policy if exists "comensales_isolate" on comensales_dia;
create policy "comensales_isolate" on comensales_dia using (is_owner_of_centro(centro_id));

alter table incidencias enable row level security;
drop policy if exists "incidencias_isolate" on incidencias;
create policy "incidencias_isolate" on incidencias using (is_owner_of_centro(centro_id));

alter table ai_log enable row level security;
drop policy if exists "ai_log_isolate" on ai_log;
create policy "ai_log_isolate" on ai_log using (is_owner_of_centro(centro_id));

-- Índices
create index if not exists idx_facturas_estado on facturas(centro_id, estado);
create index if not exists idx_gastos_fecha on gastos(centro_id, fecha desc);
create index if not exists idx_suministros_periodo on suministros(centro_id, tipo, periodo);

