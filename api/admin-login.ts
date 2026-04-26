import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { withCors } from "./_cors.js";

const bodySchema = z.object({
  pin: z.string().trim().min(3).max(32),
});

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(payload: object, secret: string) {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const expectedPin = process.env.ADMIN_PIN;
  const secret = process.env.ADMIN_AUTH_SECRET;

  if (!expectedPin || !secret) {
    return res.status(500).json({ error: "Missing ADMIN_PIN or ADMIN_AUTH_SECRET" });
  }

  if (!safeEq(parsed.data.pin, expectedPin)) {
    return res.status(401).json({ error: "Invalid PIN" });
  }

  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const token = sign({ exp, role: "biller" }, secret);

  return res.status(200).json({ ok: true, token, exp });
}
