import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withCors } from "./_cors.js";

// Voucher template download has been deprecated.
// We keep this endpoint/file to avoid breaking any old links, but it is no longer part of the active pipeline.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(410).json({
    ok: false,
    error: "Voucher download is no longer available.",
    message: "Please use the WhatsApp send option to receive voucher details and QR code.",
  });
}
