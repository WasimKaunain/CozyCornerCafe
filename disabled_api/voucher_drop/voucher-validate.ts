import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";
import { requireAdminAuth } from "./_adminAuth.js";

const bodySchema = z.object({
  code: z.string().trim().min(1).max(64),
});

function extractCode(input: string) {
  let normalized = String(input ?? "").trim();
  if (normalized.toLowerCase().includes("http")) {
    try {
      const u = new URL(normalized);
      const qp = u.searchParams.get("code");
      if (qp) normalized = qp;
      else {
        const seg = u.pathname.split("/").filter(Boolean).pop();
        if (seg) normalized = seg;
      }
    } catch {
      // ignore
    }
  }
  return normalized.trim().toUpperCase();
}

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

  const normalizedCode = extractCode(parsed.data.code);

  try {
    const pool = getPool();

    // 1) Normal vouchers
    const r = await pool.query(
      `SELECT code, offer_title, offer_description, validity_end, used_at
       FROM vouchers
       WHERE code = $1`,
      [normalizedCode]
    );

    const row = r.rows?.[0];
    if (row) {
      const now = Date.now();
      const expired = new Date(row.validity_end).getTime() <= now;
      const used = Boolean(row.used_at);

      return res.status(200).json({
        ok: true,
        status: used ? "ALREADY_USED" : expired ? "EXPIRED" : "VALID",
        voucher: {
          code: row.code,
          offer: { title: row.offer_title, description: row.offer_description },
          validityEnd: row.validity_end,
          usedAt: row.used_at,
        },
      });
    }

    // 2) Promo vouchers (QR contains plain voucher_id)
    const pr = await pool.query(
      `SELECT pv.voucher_id, pv.validity_end, pv.used_at, pc.offer_title, pc.description
       FROM promo_voucher pv
       JOIN promo_code pc ON pc.id = pv.promo_id
       WHERE pv.voucher_id = $1
       LIMIT 1`,
      [normalizedCode]
    );

    const prow = pr.rows?.[0];
    if (!prow) return res.status(404).json({ ok: false, status: "NOT_FOUND", error: "Voucher not found" });

    const now = Date.now();
    const expired = new Date(prow.validity_end).getTime() <= now;
    const used = Boolean(prow.used_at);

    return res.status(200).json({
      ok: true,
      status: used ? "ALREADY_USED" : expired ? "EXPIRED" : "VALID",
      voucher: {
        code: String(prow.voucher_id),
        offer: {
          title: prow.offer_title == null ? undefined : String(prow.offer_title),
          description: prow.description == null ? undefined : String(prow.description),
        },
        validityEnd: prow.validity_end,
        usedAt: prow.used_at,
        meta: { kind: "PROMO" },
      },
    });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Validate failed",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
