import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getPool } from "./_db";
import { withCors } from "./_cors";

const ItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1).max(99),
  unitPrice: z.number().finite().min(0),
  lineTotal: z.number().finite().min(0),
});

const CreateOrderSchema = z.object({
  orderId: z.string().min(3).max(64),
  totalPrice: z.number().finite().min(0),
  currency: z.string().min(1).max(8).default("SR"),
  items: z.array(ItemSchema).min(1),
  customer: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(3).max(40).optional().or(z.literal("")),
    address1: z.string().min(1).max(240),
    address2: z.string().max(240).optional().or(z.literal("")),
    district: z.string().min(1).max(120),
    city: z.string().min(1).max(120),
    state: z.string().min(1).max(120),
    postalCode: z.string().max(40).optional().or(z.literal("")),
    notes: z.string().max(800).optional().or(z.literal("")),
  }),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const parsed = CreateOrderSchema.parse(req.body);

    // Recompute totals defensively
    const computedTotal = parsed.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const total = Math.round(computedTotal * 100) / 100;

    const pool = getPool();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // orders
      const orderInsert = await client.query(
        `INSERT INTO orders (order_id, total_price, currency, items_json)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (order_id) DO NOTHING
         RETURNING id`,
        [parsed.orderId, total, parsed.currency, JSON.stringify(parsed.items)]
      );

      // If conflict, fetch existing id (idempotent)
      let orderRowId: number;
      if (orderInsert.rowCount === 1) {
        orderRowId = orderInsert.rows[0].id as number;
      } else {
        const existing = await client.query(`SELECT id FROM orders WHERE order_id=$1`, [parsed.orderId]);
        if (existing.rowCount !== 1) throw new Error("ORDER_INSERT_FAILED");
        orderRowId = existing.rows[0].id as number;
      }

      // order_customers (1:1 with order)
      await client.query(
        `INSERT INTO order_customers (
            order_id, name, phone, address1, address2, district, city, state, postal_code, notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (order_id) DO UPDATE SET
            name=EXCLUDED.name,
            phone=EXCLUDED.phone,
            address1=EXCLUDED.address1,
            address2=EXCLUDED.address2,
            district=EXCLUDED.district,
            city=EXCLUDED.city,
            state=EXCLUDED.state,
            postal_code=EXCLUDED.postal_code,
            notes=EXCLUDED.notes`,
        [
          orderRowId,
          parsed.customer.name,
          parsed.customer.phone || null,
          parsed.customer.address1,
          parsed.customer.address2 || "",
          parsed.customer.district,
          parsed.customer.city,
          parsed.customer.state,
          parsed.customer.postalCode || "",
          parsed.customer.notes || "",
        ]
      );

      await client.query("COMMIT");

      return res.status(200).json({ ok: true, orderId: parsed.orderId, totalPrice: total });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    const zodIssue = err?.issues ? err.issues : undefined;
    return res.status(400).json({ ok: false, error: "BAD_REQUEST", message: msg, details: zodIssue });
  }
}
