import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "./_db.js";
import { withCors } from "./_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const pool = getPool();

  // Create tables if missing (safe to run multiple times)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      validity_end TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      used_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);
  `);

  return res.status(200).json({ ok: true });
}
