/**
 * The storefront's database schema, as ordered migrations. Never edit a migration that has
 * shipped; add a new one. Every table enables row level security (a test checks): the app
 * connects as the tables' owner, so RLS never limits it, and Supabase's Data API sees nothing.
 */
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
-- Orders the distributor's Suppli Afya portal couldn't take when they were placed. Each waits here
-- until the portal takes it, then is deleted; after 7 days it's deleted anyway (the customer's
-- WhatsApp message reached the distributor regardless). Holds the customer's name, phone and delivery.
create table pending_orders (
  id uuid primary key default gen_random_uuid(),
  storefront text not null,
  ref text not null,
  body jsonb not null,
  attempts int not null default 1,
  last_error text,
  created_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  unique (storefront, ref)
);
create index pending_orders_due_idx on pending_orders(next_attempt_at);

alter table schema_migrations enable row level security;
alter table pending_orders enable row level security;

-- Supabase grants its Data API roles every new table; this app never uses that API.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') and exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on sequences from anon, authenticated;
    alter default privileges in schema public revoke all on functions from anon, authenticated;
  end if;
end $$;
`,
  },
];
