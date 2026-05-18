import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { withCors } from "./_cors.js";

const querySchema = z.object({
  to: z.string().trim().min(8).max(20).optional(),
  text: z.string().trim().min(1).max(1000).optional(),
  code: z.string().trim().min(4).max(32).optional(),
});

function buildWaLink(to: string, text: string) {
  const normalized = to.replace(/\s+/g, "");
  // wa.me expects digits without +, but wa.me also works with international without plus.
  const phoneDigits = normalized.replace(/^\+/, "");
  return `https://wa.me/${encodeURIComponent(phoneDigits)}?text=${encodeURIComponent(text)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { to, text, code } = parsed.data;

  // Counter-scan QR: encode only voucher code
  const qrData = code ? String(code) : null;

  // Customer-share WhatsApp link (optional)
  const waUrl = to && text ? buildWaLink(to, text) : null;

  const dataToEncode = qrData ?? waUrl;
  if (!dataToEncode) return res.status(400).json({ error: "Missing code or (to + text)" });

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
    dataToEncode
  )}`;

  return res.status(200).json({ ok: true, waUrl, qrUrl: qr, qrData: dataToEncode });
}
