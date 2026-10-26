import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedCatalog } from "./seed";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const migrationsFolder = path.join(process.cwd(), "drizzle");

const store = globalThis as typeof globalThis & { __narishopDb?: Promise<Db> };

/**
 * С DATABASE_URL — Neon (pooled-строка). Без неё — встроенный PostgreSQL (PGlite) в памяти:
 * при старте он применяет миграции из drizzle/ и заполняется demo-каталогом.
 */
export function getDb(): Promise<Db> {
  store.__narishopDb ??= connect().catch((error: unknown) => {
    store.__narishopDb = undefined;
    throw error;
  });
  return store.__narishopDb;
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return connectNeon(url);
  return createLocalDb();
}

export async function connectNeon(connectionString: string): Promise<Db> {
  const { Pool } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  return drizzle({ client: new Pool({ connectionString }), schema });
}

export async function createLocalDb({ seed = true }: { seed?: boolean } = {}): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder });
  if (seed) await seedCatalog(db);
  return db;
}
