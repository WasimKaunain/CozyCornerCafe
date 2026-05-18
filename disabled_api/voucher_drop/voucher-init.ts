import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPool } from "./_db.js";
import { withCors } from "./_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const pool = getPool();

  // Idempotent schema setup + migrations for BOTH normal and promo flows.
  // Safe to run multiple times.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_whatsapp ON customers(whatsapp);

    CREATE TABLE IF NOT EXISTS offers (
      id INT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      initial_stock INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      validity_end TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      used_at TIMESTAMPTZ
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_vouchers_customer_id ON vouchers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);

    -- add offer/qr columns if missing
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_id INT;
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_title TEXT;
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_description TEXT;
    ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS qr_url TEXT;

    CREATE INDEX IF NOT EXISTS idx_vouchers_offer_id ON vouchers(offer_id);

    -- Promo tables
    CREATE TABLE IF NOT EXISTS promo_code (
      id BIGSERIAL PRIMARY KEY,
      influencer_name TEXT NOT NULL,
      promo_code TEXT NOT NULL UNIQUE,
      offer_title TEXT NOT NULL,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_promo_code_code ON promo_code(promo_code);

    CREATE TABLE IF NOT EXISTS promo_voucher (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      promo_id BIGINT NOT NULL REFERENCES promo_code(id) ON DELETE RESTRICT,
      promo_code TEXT NOT NULL,
      voucher_id TEXT NOT NULL,
      qr_url TEXT,
      validity_end TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      used_at TIMESTAMPTZ
    );

    -- Ensure columns exist even if table was created with older shape
    ALTER TABLE promo_voucher ADD COLUMN IF NOT EXISTS promo_code TEXT;
    ALTER TABLE promo_voucher ADD COLUMN IF NOT EXISTS voucher_id TEXT;
    ALTER TABLE promo_voucher ADD COLUMN IF NOT EXISTS qr_url TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_promo_voucher_voucher_id ON promo_voucher(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_promo_voucher_customer_id ON promo_voucher(customer_id);
    CREATE INDEX IF NOT EXISTS idx_promo_voucher_promo_id ON promo_voucher(promo_id);
  `);

  return res.status(200).json({ ok: true });
}
