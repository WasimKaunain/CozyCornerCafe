import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getPool } from "./_db";
import { withCors } from "./_cors";
import { customAlphabet } from "nanoid";

// Offer pool (DB-backed catalog)
// NOTE: We keep an in-code seed list so the DB can be auto-initialized.
const OFFER_SEED = [
  {
    id: 1,
    title: "Buy 1 Drink, Get 1 Free",
    description: "Buy any drink and get another drink free of equal or lesser value.",
    initialStock: 8,
  },
  {
    id: 2,
    title: "Pancakes/Waffles + Free Coffee of the Day",
    description:
      "Order a full portion of pancakes or waffles and enjoy a complimentary Coffee of the Day.",
    initialStock: 8,
  },
  {
    id: 3,
    title: "Pancakes/Waffles + Free V60 Coffee",
    description: "Order pancakes or waffles and get a free V60 coffee.",
    initialStock: 8,
  },
  {
    id: 4,
    title: "French Toast + 50% Off Hot Coffee",
    description: "Order French toast and get 50% off any hot coffee.",
    initialStock: 8,
  },
  {
    id: 5,
    title: "Ciabatta + Free Cappuccino",
    description: "Order a ciabatta sandwich and enjoy a free cappuccino.",
    initialStock: 8,
  },
  {
    id: 6,
    title: "Ciabatta + Mojito for Just 3 SR",
    description: "Order a ciabatta sandwich and get a mojito for only 3 SR.",
    initialStock: 8,
  },
  {
    id: 7,
    title: "Cheesecake + Free Espresso",
    description: "Order cheesecake and get a free espresso.",
    initialStock: 10,
  },
  {
    id: 8,
    title: "Peach Tea for Only 5 SR",
    description: "Enjoy a peach tea for only 5 SR.",
    initialStock: 8,
  },
  {
    id: 9,
    title: "Espresso for Only 2 SR",
    description: "Grab an espresso for only 2 SR.",
    initialStock: 10,
  },
  {
    id: 10,
    title: "Frappe + 50% Off Any Dessert",
    description: "Order any frappe and get 50% off any dessert.",
    initialStock: 10,
  },
  {
    id: 11,
    title: "Free Passion Fruit Mojito",
    description: "Enjoy a passion fruit mojito on us.",
    initialStock: 4,
  },
  {
    id: 12,
    title: "Hibiscus Lemonade + Free Croissant",
    description: "Order a hibiscus lemonade and enjoy a free croissant.",
    initialStock: 10,
  },
] as const;

type OfferId = (typeof OFFER_SEED)[number]["id"];

type Offer = {
  id: OfferId;
  title: string;
  description: string;
  initialStock: number;
};

function pickWeightedOffer(offers: Offer[], usedById: Record<number, number>): Offer {
  const weighted: Array<{ offer: Offer; w: number }> = offers
    .map((o) => ({
      offer: o,
      w: Math.max(0, (o.initialStock ?? 0) - (usedById[o.id] ?? 0)),
    }))
    .filter((x) => x.w > 0);

  if (!weighted.length) {
    // If all offers are exhausted, the campaign is effectively over (even if total cap not reached).
    throw new Error("OFFERS_EXHAUSTED");
  }

  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.offer;
  }
  return weighted[weighted.length - 1].offer;
}

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]{8,20}$/, "Invalid phone number"),
});

const nano = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

function voucherCode() {
  return nano();
}

// Valid till 3rd May midnight (23:59:59) in Asia/Riyadh
function validityEnd() {
  // NOTE: JS Date uses local timezone on server; Vercel runs UTC.
  // We'll create 2026-05-03T23:59:59 in Asia/Riyadh by subtracting 3 hours (UTC+3).
  // Riyadh is UTC+3 (no DST).
  const utc = new Date(Date.UTC(2026, 4, 3, 20, 59, 59));
  return utc;
}

const TOTAL_VOUCHER_CAP = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const isProd = process.env.NODE_ENV === "production";

  try {
    const { name, whatsapp } = parsed.data;

    const pool = getPool();

    // Ensure schema exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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

      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_whatsapp ON customers(whatsapp);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_vouchers_customer_id ON vouchers(customer_id);
      CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);
    `);

    // ---- Schema migrations (idempotent) ----
    // Older DBs may already have `vouchers` created without offer columns.
    await pool.query(`
      ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_id INT;
      ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_title TEXT;
      ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS offer_description TEXT;

      CREATE INDEX IF NOT EXISTS idx_vouchers_offer_id ON vouchers(offer_id);
    `);

    // Seed offers (idempotent)
    for (const o of OFFER_SEED) {
      await pool.query(
        `INSERT INTO offers (id, title, description, initial_stock)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             initial_stock = EXCLUDED.initial_stock`,
        [o.id, o.title, o.description, o.initialStock]
      );
    }

    // After seeding offers, backfill any NULL offer columns (only for legacy rows, if any)
    await pool.query(`
      UPDATE vouchers
      SET offer_id = COALESCE(offer_id, 1),
          offer_title = COALESCE(offer_title, 'Buy 1 Drink, Get 1 Free'),
          offer_description = COALESCE(offer_description, 'Buy any drink and get another drink free of equal or lesser value.')
      WHERE offer_id IS NULL OR offer_title IS NULL OR offer_description IS NULL;
    `);

    // HARD CAP: stop after 100 vouchers total
    const totalRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM vouchers`);
    const totalIssued = Number(totalRes.rows?.[0]?.cnt ?? 0);
    if (totalIssued >= TOTAL_VOUCHER_CAP) {
      return res.status(410).json({
        error: "Vouchers are fully claimed",
        message:
          "Sorry, vouchers are currently unavailable. Thank you for the amazing response! Follow us on Instagram for the next drop.",
      });
    }

    // Insert customer (WhatsApp must be unique)
    let customerId: number;
    try {
      const customerRes = await pool.query(
        `INSERT INTO customers (name, whatsapp) VALUES ($1, $2) RETURNING id`,
        [name, whatsapp]
      );
      customerId = customerRes.rows[0]?.id as number;
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "This WhatsApp number has already been used." });
      }
      throw err;
    }

    // Weighted offer selection based on remaining stock in the offers catalog
    const offersRes = await pool.query(
      `SELECT id, title, description, initial_stock FROM offers ORDER BY id ASC`
    );
    const offers: Offer[] = offersRes.rows.map((r: any) => ({
      id: Number(r.id) as OfferId,
      title: String(r.title),
      description: String(r.description),
      initialStock: Number(r.initial_stock),
    }));

    const countsRes = await pool.query(
      `SELECT offer_id, COUNT(*)::int FROM vouchers WHERE offer_id IS NOT NULL GROUP BY offer_id`
    );
    const usedById: Record<number, number> = {};
    for (const r of countsRes.rows) usedById[Number(r.offer_id)] = Number(r.cnt);

    let offer: Offer;
    try {
      // Dynamic distribution: weights are recomputed every request from remaining stock.
      offer = pickWeightedOffer(offers.length ? offers : (OFFER_SEED as any), usedById);
    } catch (e: any) {
      if (String(e?.message) === "OFFERS_EXHAUSTED") {
        return res.status(410).json({
          error: "Vouchers are fully claimed",
          message:
            "Sorry, vouchers are currently unavailable. Thank you for the amazing response! Follow us on Instagram for the next drop.",
        });
      }
      throw e;
    }

    const validEnd = validityEnd();

    // Insert voucher (retry on code collisions)
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = voucherCode();
      try {
        const voucherRes = await pool.query(
          `INSERT INTO vouchers (customer_id, code, validity_end, offer_id, offer_title, offer_description)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, code, validity_end, created_at, offer_id, offer_title, offer_description`,
          [customerId, code, validEnd, offer.id, offer.title, offer.description]
        );
        const row = voucherRes.rows[0];

        // Provide a downloadable voucher-card endpoint (client will download/share manually)
        const voucherCardUrl = `/api/voucher-card?code=${encodeURIComponent(row.code)}`;

        return res.status(200).json({
          ok: true,
          voucher: {
            id: row.id,
            code: row.code,
            validityEnd: row.validity_end,
            createdAt: row.created_at,
            offer: {
              id: row.offer_id,
              title: row.offer_title,
              description: row.offer_description,
            },
            voucherCardUrl,
          },
          customer: { id: customerId, name, whatsapp },
        });
      } catch (err: any) {
        const pgCode = err?.code;
        if (pgCode === "23505") {
          // unique violation (likely code collision), retry
          continue;
        }

        return res.status(500).json({
          error: "Database error",
          ...(isProd
            ? {}
            : {
                debug: {
                  message: err?.message,
                  code: err?.code,
                  detail: err?.detail,
                  hint: err?.hint,
                  where: err?.where,
                },
              }),
        });
      }
    }

    return res.status(500).json({ error: "Failed to generate unique voucher" });
  } catch (err: any) {
    // Covers pool init errors and schema creation errors
    return res.status(500).json({
      error: "Function failed",
      ...(isProd
        ? {}
        : {
            debug: {
              message: err?.message,
              code: err?.code,
              detail: err?.detail,
              hint: err?.hint,
              where: err?.where,
              stack: err?.stack,
            },
          }),
    });
  }
}
