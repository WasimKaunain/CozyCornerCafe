import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";
import { requireAdminConsoleAuth } from "./_adminConsoleAuth.js";

const querySchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
});

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
  return s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = requireAdminConsoleAuth(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query" });

  try {
    const pool = getPool();

    const r = await pool.query(
      `SELECT offer_id, offer_title, COUNT(*)::int AS cnt
       FROM vouchers
       GROUP BY offer_id, offer_title
       ORDER BY offer_id ASC NULLS LAST`
    );

    if (parsed.data.format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=vouchers-claimed.csv`);
      const header = ["offer_id", "offer_title", "count"].join(",");
      const lines = r.rows.map((x: any) =>
        [x.offer_id, x.offer_title, x.cnt].map(csvEscape).join(",")
      );
      return res.status(200).send([header, ...lines].join("\n"));
    }

    return res.status(200).json({
      ok: true,
      groups: r.rows.map((x: any) => ({
        offerId: x.offer_id === null ? null : Number(x.offer_id),
        offerTitle: x.offer_title === null ? null : String(x.offer_title),
        count: Number(x.cnt),
      })),
    });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Failed to load claimed vouchers",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
