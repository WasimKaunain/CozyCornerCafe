import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL env var (Neon connection string)");
  }

  pool = new Pool({
    connectionString,
    // Neon/serverless friendly.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ssl: connectionString.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
  });

  return pool;
}
