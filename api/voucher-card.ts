import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { renderVoucherCardPng } from "./whatsapp-media.js";
import { getPool } from "./_db.js";

const querySchema = z.object({
  code: z.string().trim().min(8).max(8),
});

// Returns a ready-to-download PNG voucher card for a given voucher code.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing/invalid code" });
  }

  try {
    const { code } = parsed.data;

    // Look up assigned offer for this voucher code
    const pool = getPool();
    const rowRes = await pool.query(
      `SELECT code, offer_title, offer_description FROM vouchers WHERE code = $1`,
      [code]
    );

    const row = rowRes.rows?.[0];
    if (!row) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    const offerText = `${row.offer_title}\n${row.offer_description}`;

    // Counter-scan QR: encode ONLY voucher code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(code)}`;

    const png = await renderVoucherCardPng({
      code: row.code,
      qrUrl,
      offerText,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `attachment; filename="cozy-corner-voucher-${code}.png"`);

    return res.status(200).send(png);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to render voucher card", detail: err?.message });
  }
}
