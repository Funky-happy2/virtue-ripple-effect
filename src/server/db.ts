import postgres from "postgres";

// Lazily-built singleton. Neon's pooler is PgBouncer in transaction mode, so
// prepared statements must be off — postgres.js otherwise caches statement names
// the pooler will not have on the next connection it hands us.
let sql: postgres.Sql | null | undefined;

export function getSql(): postgres.Sql | null {
  if (sql !== undefined) return sql;

  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.warn("[db] DATABASE_URL is unset — telemetry is disabled for this process.");
    sql = null;
    return sql;
  }

  sql = postgres(url, {
    ssl: "require",
    prepare: false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},
  });
  return sql;
}

/**
 * Runs a query, returning `fallback` if the database is unreachable or unconfigured.
 * The simulation is fully playable without a database; aggregate panels simply
 * report that they have no data yet, so a Neon outage never takes the page down.
 */
export async function withDb<T>(fn: (sql: postgres.Sql) => Promise<T>, fallback: T): Promise<T> {
  const client = getSql();
  if (!client) return fallback;
  try {
    return await fn(client);
  } catch (error) {
    console.error("[db] query failed", error);
    return fallback;
  }
}
