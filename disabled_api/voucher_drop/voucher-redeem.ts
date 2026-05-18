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

    // 1) Try normal vouchers first (atomic redeem)
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

    // Look up normal voucher to give correct reason
    const lookup = await pool.query(
      `SELECT code, offer_title, offer_description, validity_end, used_at
       FROM vouchers
       WHERE code = $1`,
      [normalizedCode]
    );

    const row = lookup.rows?.[0];
    if (row) {
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
    }

    // 2) Not a normal voucher: attempt promo voucher redeem (atomic)
    const pr = await pool.query(
      `UPDATE promo_voucher
       SET used_at = NOW()
       WHERE voucher_id = $1
         AND used_at IS NULL
         AND validity_end > NOW()
       RETURNING voucher_id, validity_end, used_at`,
      [normalizedCode]
    );

    if (pr.rowCount === 1) {
      const prow = pr.rows[0];

      const offerRes = await pool.query(
        `SELECT pc.offer_title, pc.description
         FROM promo_voucher pv
         JOIN promo_code pc ON pc.id = pv.promo_id
         WHERE pv.voucher_id = $1
         LIMIT 1`,
        [normalizedCode]
      );
      const offerRow = offerRes.rows?.[0];

      return res.status(200).json({
        ok: true,
        status: "REDEEMED",
        voucher: {
          code: String(prow.voucher_id),
          offer: {
            title: offerRow?.offer_title == null ? undefined : String(offerRow.offer_title),
            description: offerRow?.description == null ? undefined : String(offerRow.description),
          },
          validityEnd: prow.validity_end,
          usedAt: prow.used_at,
          meta: { kind: "PROMO" },
        },
      });
    }

    // Not redeemed: find reason for promo voucher
    const plook = await pool.query(
      `SELECT pv.voucher_id, pv.validity_end, pv.used_at, pc.offer_title, pc.description
       FROM promo_voucher pv
       JOIN promo_code pc ON pc.id = pv.promo_id
       WHERE pv.voucher_id = $1
       LIMIT 1`,
      [normalizedCode]
    );

    const prow = plook.rows?.[0];
    if (!prow) return res.status(404).json({ ok: false, status: "NOT_FOUND", error: "Voucher not found" });

    if (prow.used_at) {
      return res.status(409).json({
        ok: false,
        status: "ALREADY_USED",
        error: "Voucher already used",
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
    }

    const expired = new Date(prow.validity_end).getTime() <= Date.now();
    if (expired) {
      return res.status(410).json({
        ok: false,
        status: "EXPIRED",
        error: "Voucher expired",
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
