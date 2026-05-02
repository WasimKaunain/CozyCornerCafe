import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withCors } from "./_cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  return res.status(410).json({
    error: "GONE",
    message:
      "This endpoint is disabled. Use POST /api/voucher-create (supports optional promoCode) instead.",
  });
}
