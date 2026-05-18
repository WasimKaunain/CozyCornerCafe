import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withCors } from "./_cors.js";

// NOTE: This file still counts as a Vercel serverless function while it exists under `api/`.
// Move it to `api/disabled_hobby/` (or delete it) to free up function slots.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  return res.status(410).json({
    error: "GONE",
    message:
      "This endpoint is disabled. Use POST /api/voucher-create (supports optional promoCode) instead.",
  });
}
