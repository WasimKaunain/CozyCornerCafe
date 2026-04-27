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

  const isProd = process.env.NODE_ENV === "production";

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    console.warn("[admin-login] invalid input", {
      hasBody: Boolean(req.body),
      issues: parsed.error.issues?.map((i) => ({ path: i.path, message: i.message })),
    });
    return res.status(400).json({
      error: "Invalid input",
      details: isProd ? undefined : parsed.error.flatten(),
    });
  }

  const expectedPinRaw = process.env.ADMIN_PIN;
  const secretRaw = process.env.ADMIN_AUTH_SECRET;

  // Note: do not log secret values.
  console.log("[admin-login] env check", {
    hasAdminPin: Boolean(expectedPinRaw),
    adminPinLen: expectedPinRaw ? String(expectedPinRaw).length : 0,
    hasAdminAuthSecret: Boolean(secretRaw),
  });

  if (!expectedPinRaw && !secretRaw) {
    return res.status(500).json({
      error: "Missing environment variables: ADMIN_PIN and ADMIN_AUTH_SECRET",
    });
  }

  if (!expectedPinRaw) {
    return res.status(500).json({
      error: "Missing environment variable: ADMIN_PIN",
    });
  }

  if (!secretRaw) {
    return res.status(500).json({
      error: "Missing environment variable: ADMIN_AUTH_SECRET",
    });
  }

  // Harden against accidental whitespace/newlines in env variables and user input.
  const expectedPin = String(expectedPinRaw).trim();
  const providedPin = String(parsed.data.pin).trim();
  const secret = String(secretRaw);

  // Safe debug info (do not print PIN)
  console.log("[admin-login] pin compare", {
    providedLen: providedPin.length,
    expectedLen: expectedPin.length,
    expectedTrimmedChanged: String(expectedPinRaw).length !== expectedPin.length,
  });

  if (!safeEq(providedPin, expectedPin)) {
    console.warn("[admin-login] invalid pin", {
      providedLen: providedPin.length,
    });
    return res.status(401).json({ error: "Invalid PIN" });
  }

  // 1 day TTL
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const token = sign({ exp, role: "biller" }, secret);

  return res.status(200).json({ ok: true, token, exp });
}
