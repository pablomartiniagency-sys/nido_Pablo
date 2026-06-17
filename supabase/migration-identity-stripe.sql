-- Ejecutar en el proyecto de identidad (szckjmeawinxpqwqhylf)
-- Añade columnas de Stripe a identity_tenants

alter table public.identity_tenants
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text default 'inactive',
  add column if not exists plan text,
  add column if not exists updated_at timestamptz default now();

-- Índice para buscar por stripe_customer_id
create index if not exists idx_identity_tenants_stripe_customer on public.identity_tenants(stripe_customer_id);
create index if not exists idx_identity_tenants_stripe_subscription on public.identity_tenants(stripe_subscription_id);
