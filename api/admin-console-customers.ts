import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";
import { getPool } from "./_db.js";
import { requireAdminConsoleAuth } from "./_adminConsoleAuth.js";

const querySchema = z.object({
  // Allow empty string so the UI can call `?q=` without triggering 400.
  // We normalize it to "" and treat as no filter.
  q: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  format: z.enum(["json", "csv"]).optional(),
});

function normalizeQ(raw: string) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  // keep leading + if present, strip other non-digits
  const cleaned = s.startsWith("+") ? "+" + s.slice(1).replace(/[^0-9]/g, "") : s.replace(/[^0-9]/g, "");
  return cleaned;
}

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

  const { page, limit, format } = parsed.data;
  const qRaw = parsed.data.q;
  const q = qRaw ? normalizeQ(qRaw) : "";

  const offset = (page - 1) * limit;

  try {
    const pool = getPool();

    const where = q ? "WHERE whatsapp LIKE $1" : "";
    const args = q ? [`%${q}%`, limit, offset] : [limit, offset];

    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM customers
       ${where}`,
      q ? [`%${q}%`] : []
    );

    const rowsRes = await pool.query(
      `SELECT id, name, whatsapp, created_at
       FROM customers
       ${where}
       ORDER BY created_at DESC
       LIMIT $${q ? 2 : 1} OFFSET $${q ? 3 : 2}`,
      args
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=customers_page-${page}.csv`);

      const header = ["id", "name", "whatsapp", "created_at"].join(",");
      const lines = rowsRes.rows.map((x: any) =>
        [x.id, x.name, x.whatsapp, x.created_at].map(csvEscape).join(",")
      );
      return res.status(200).send([header, ...lines].join("\n"));
    }

    return res.status(200).json({
      ok: true,
      page,
      limit,
      total: totalRes.rows?.[0]?.cnt ?? 0,
      customers: rowsRes.rows.map((x: any) => ({
        id: Number(x.id),
        name: String(x.name),
        whatsapp: String(x.whatsapp),
        createdAt: x.created_at,
      })),
    });
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Failed to load customers",
      ...(isProd ? {} : { debug: { message: err?.message, stack: err?.stack } }),
    });
  }
}
