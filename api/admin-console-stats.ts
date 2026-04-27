import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";
import { requireAdminConsoleAuth } from "./_adminConsoleAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = requireAdminConsoleAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    const pool = getPool();

    const cRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM customers`);
    const vRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM vouchers`);
    const rRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM vouchers WHERE used_at IS NOT NULL`);

    return res.status(200).json({
      ok: true,
      customers: cRes.rows?.[0]?.cnt ?? 0,
      vouchersClaimed: vRes.rows?.[0]?.cnt ?? 0,
      vouchersRedeemed: rRes.rows?.[0]?.cnt ?? 0,
    });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Failed to load stats",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
