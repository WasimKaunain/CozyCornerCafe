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

  const codeRaw = parsed.data.code;

  try {
    let normalizedCode = String(codeRaw).trim();

    // If scanned QR encodes a URL, try to extract ?code=... or last segment
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

    const pool = getPool();
    const r = await pool.query(
      `SELECT code, offer_title, offer_description, validity_end, used_at
       FROM vouchers
       WHERE code = $1`,
      [normalizedCode]
    );

    const row = r.rows?.[0];
    if (!row) return res.status(404).json({ ok: false, status: "NOT_FOUND", error: "Voucher not found" });

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
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Validate failed",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
