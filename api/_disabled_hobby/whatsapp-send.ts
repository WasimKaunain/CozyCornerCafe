import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: "Removed",
    message: "This endpoint has been removed. Voucher WhatsApp delivery happens automatically on voucher creation.",
  });
}
