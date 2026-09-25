import { MIGRATIONS } from "./schema";

/**
 * The storefront's own database: the Supabase project suppli_afya-template_site, never the
 * Suppli Afya app's. Optional. Without DATABASE_URL the storefront keeps nothing on a server,
 * and an order the portal can't take straight away isn't tried again.
 */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
}

const g = globalThis as unknown as { __storefrontDb?: Promise<Db> };

/** The database, or null when this deploy has none. */
export function db(): Promise<Db> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__storefrontDb) {
    g.__storefrontDb = connect(url).catch((e) => {
      g.__storefrontDb = undefined;
      throw e;
    });
  }
  return g.__storefrontDb;
}

async function connect(url: string): Promise<Db> {
  const postgres = (await import("postgres")).default;
  // prepare:false for Supabase's transaction pooler (port 6543). Idle connections close between requests.
  const sql = postgres(url, { max: 3, prepare: false, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} });
  const d: Db = {
    query: async <T,>(text: string, params: unknown[] = []) => (await sql.unsafe(text, params as never[])) as unknown as T[],
    exec: async (text: string) => {
      await sql.unsafe(text);
    },
  };
  await migrate(d);
  return d;
}

export async function migrate(d: Db) {
  await d.exec(`create table if not exists schema_migrations (version int primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await d.query<{ version: number }>(`select version from schema_migrations`)).map((r) => r.version));
  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    await d.exec(m.sql);
    await d.query(`insert into schema_migrations (version) values ($1) on conflict do nothing`, [m.version]);
  }
}

/** JSON parameters must be passed as text and cast with ::jsonb in the SQL. */
export const json = (v: unknown) => JSON.stringify(v ?? null);
