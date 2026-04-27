import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getPool } from "./_db.js";
import { withCors } from "./_cors.js";

const bodySchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]{8,20}$/, "Invalid phone number"),
  otp: z.string().trim().min(4).max(8).regex(/^[0-9]{4,8}$/, "Invalid code"),
});

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeWa(input: string) {
  return input.replace(/\s+/g, "");
}

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signVerificationToken(payload: object, secret: string, expSeconds: number) {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expSeconds })));
  const data = `${header}.${body}`;
  const sig = createHash("sha256")
    .update(data + secret)
    .digest();
  return `${data}.${b64url(sig)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  withCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const isProd = process.env.NODE_ENV === "production";

  try {
    const whatsapp = normalizeWa(parsed.data.whatsapp);
    const otp = parsed.data.otp;

    const pool = getPool();

    // Get the latest unverified request
    const reqRes = await pool.query(
      `SELECT id, otp_hash, expires_at, attempts
       FROM otp_requests
       WHERE whatsapp = $1 AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [whatsapp]
    );

    const row = reqRes.rows?.[0];
    if (!row) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Code expired" });
    }

    const attempts = Number(row.attempts ?? 0);
    if (attempts >= 5) {
      return res.status(429).json({ error: "Too many attempts", message: "Please request a new code." });
    }

    const pepper = process.env.OTP_PEPPER || "";
    const expected = sha256(`${whatsapp}:${otp}:${pepper}`);

    if (expected !== String(row.otp_hash)) {
      await pool.query(`UPDATE otp_requests SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
      return res.status(400).json({ error: "Invalid code" });
    }

    await pool.query(`UPDATE otp_requests SET verified_at = NOW() WHERE id = $1`, [row.id]);

    const secret = process.env.OTP_VERIFY_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Missing OTP_VERIFY_TOKEN_SECRET" });
    }

    const token = signVerificationToken({ whatsapp, verified: true }, secret, 10 * 60);

    return res.status(200).json({ ok: true, token });
  } catch (err: any) {
    return res.status(500).json({
      error: "OTP verify failed",
      ...(isProd
        ? {}
        : {
            debug: { message: err?.message, stack: err?.stack },
          }),
    });
  }
}
