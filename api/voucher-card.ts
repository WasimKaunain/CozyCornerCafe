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

  // Avoid any caching of generated images (Vercel edge, browser, etc.)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing/invalid code" });
  }

  const isProd = process.env.NODE_ENV === "production";
  const requestId = (req.headers["x-vercel-id"] as string) || (req.headers["x-request-id"] as string) || "";

  // Server-side debug (visible in Vercel -> Functions -> Logs)
  console.log("[voucher-card] start", {
    requestId,
    code: parsed.data.code,
    host: req.headers.host,
    forwardedHost: req.headers["x-forwarded-host"],
    forwardedProto: req.headers["x-forwarded-proto"],
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    const { code } = parsed.data;

    // Look up assigned offer for this voucher code
    const pool = getPool();
    const rowRes = await pool.query(
      `SELECT code, offer_title, offer_description FROM vouchers WHERE code = $1`,
      [code]
    );

    const row = rowRes.rows?.[0];
    console.log("[voucher-card] db lookup", { requestId, found: Boolean(row) });

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

    console.log("[voucher-card] rendered", { requestId, bytes: png?.byteLength });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="cozy-corner-voucher-${code}.png"`);

    return res.status(200).send(png);
  } catch (err: any) {
    console.error("[voucher-card] error", {
      requestId,
      message: err?.message,
      stack: err?.stack,
    });

    return res.status(500).json({
      error: "Failed to render voucher card",
      detail: err?.message,
      ...(isProd
        ? {}
        : {
            debug: {
              nodeEnv: process.env.NODE_ENV,
              host: req.headers.host,
              forwardedHost: req.headers["x-forwarded-host"],
              forwardedProto: req.headers["x-forwarded-proto"],
            },
          }),
    });
  }
}
