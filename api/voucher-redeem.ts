import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";
import { requireAdminAuth } from "./_adminAuth.js";

const bodySchema = z.object({
  code: z.string().trim().min(1).max(64),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = requireAdminAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const code = parsed.data.code.toUpperCase();

  try {
    const pool = getPool();

    // If QR contains a full URL, try to extract ?code=... or last path segment
    let normalizedCode = code;
    if (normalizedCode.includes("http")) {
      try {
        const u = new URL(normalizedCode);
        const qp = u.searchParams.get("code");
        if (qp) normalizedCode = qp;
        else {
          const seg = u.pathname.split("/").filter(Boolean).pop();
          if (seg) normalizedCode = seg;
        }
      } catch {
        // ignore
      }
    }

    normalizedCode = normalizedCode.trim().toUpperCase();

    // Atomic redeem: set used_at only if currently unused and not expired.
    const r = await pool.query(
      `UPDATE vouchers
       SET used_at = NOW()
       WHERE code = $1
         AND used_at IS NULL
         AND validity_end > NOW()
       RETURNING code, offer_title, offer_description, validity_end, used_at`,
      [normalizedCode]
    );

    if (r.rowCount === 1) {
      const row = r.rows[0];
      return res.status(200).json({
        ok: true,
        status: "REDEEMED",
        voucher: {
          code: row.code,
          offer: { title: row.offer_title, description: row.offer_description },
          validityEnd: row.validity_end,
          usedAt: row.used_at,
        },
      });
    }

    // Not redeemed: find reason
    const lookup = await pool.query(
      `SELECT code, offer_title, offer_description, validity_end, used_at
       FROM vouchers
       WHERE code = $1`,
      [normalizedCode]
    );

    const row = lookup.rows?.[0];
    if (!row) return res.status(404).json({ ok: false, status: "NOT_FOUND", error: "Voucher not found" });

    if (row.used_at) {
      return res.status(409).json({
        ok: false,
        status: "ALREADY_USED",
        error: "Voucher already used",
        voucher: {
          code: row.code,
          offer: { title: row.offer_title, description: row.offer_description },
          validityEnd: row.validity_end,
          usedAt: row.used_at,
        },
      });
    }

    const expired = new Date(row.validity_end).getTime() <= Date.now();
    if (expired) {
      return res.status(410).json({
        ok: false,
        status: "EXPIRED",
        error: "Voucher expired",
        voucher: {
          code: row.code,
          offer: { title: row.offer_title, description: row.offer_description },
          validityEnd: row.validity_end,
          usedAt: row.used_at,
        },
      });
    }

    return res.status(400).json({ ok: false, status: "NOT_REDEEMED", error: "Voucher not redeemed" });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Redeem failed",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
