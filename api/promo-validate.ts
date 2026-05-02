import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";

const querySchema = z.object({
  code: z.string().trim().min(1).max(48),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid promo code" });
  }

  const code = parsed.data.code.trim().toUpperCase();

  try {
    const pool = getPool();

    // Ensure tables exist (idempotent)
    await pool.query(`
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
    `);

    const r = await pool.query(
      `SELECT id, influencer_name, promo_code, offer_title, description
       FROM promo_code
       WHERE promo_code = $1 AND active = TRUE
       LIMIT 1`,
      [code]
    );

    const row = r.rows?.[0];
    if (!row) {
      return res.status(404).json({ ok: false, status: "INVALID", error: "Invalid promo code" });
    }

    return res.status(200).json({
      ok: true,
      status: "VALID",
      promo: {
        id: Number(row.id),
        influencerName: String(row.influencer_name),
        promoCode: String(row.promo_code),
        offerTitle: String(row.offer_title),
        description: row.description == null ? null : String(row.description),
      },
    });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      ok: false,
      error: "Promo validate failed",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
