import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getPool } from "./_db";
import { withCors } from "./_cors";

const querySchema = z.object({
  // Either voucher code OR whatsapp
  code: z.string().trim().min(4).max(32).optional(),
  whatsapp: z.string().trim().min(8).max(20).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }

  const { code, whatsapp } = parsed.data;
  if (!code && !whatsapp) {
    return res.status(400).json({ error: "Provide ?code=... or ?whatsapp=..." });
  }

  const pool = getPool();

  // Note: this endpoint is for lightweight auditing while you build a proper staff dashboard.
  // Consider protecting it later (secret header / auth).
  const r = await pool.query(
    `
    SELECT
      d.id,
      d.status,
      d.to_number as "to",
      d.provider_message_id as "providerMessageId",
      d.provider_media_id as "providerMediaId",
      d.error_message as "errorMessage",
      d.created_at as "createdAt",
      v.code as "voucherCode",
      c.whatsapp as "customerWhatsapp",
      c.name as "customerName"
    FROM whatsapp_deliveries d
    JOIN vouchers v ON v.id = d.voucher_id
    JOIN customers c ON c.id = d.customer_id
    WHERE ($1::text IS NULL OR v.code = $1)
      AND ($2::text IS NULL OR c.whatsapp = $2)
    ORDER BY d.created_at DESC
    LIMIT 50
    `,
    [code ?? null, whatsapp ?? null]
  );

  return res.status(200).json({ ok: true, rows: r.rows });
}
