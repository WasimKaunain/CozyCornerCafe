import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHash, randomInt } from "node:crypto";
import { getPool } from "./_db";
import { withCors } from "./_cors";
import { sendWhatsAppOtpTemplateMessage } from "./whatsapp-media";

const bodySchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]{8,20}$/, "Invalid phone number"),
});

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeWa(input: string) {
  return input.replace(/\s+/g, "");
}

function makeOtp(len = 6) {
  const min = 10 ** (len - 1);
  const max = 10 ** len - 1;
  return String(randomInt(min, max + 1));
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

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    const languageCode = process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en_US";

    if (!token || !phoneNumberId || !templateName) {
      return res.status(500).json({
        error: "Missing WhatsApp OTP configuration",
        ...(isProd
          ? {}
          : {
              debug: {
                WHATSAPP_TOKEN: Boolean(token),
                WHATSAPP_PHONE_NUMBER_ID: Boolean(phoneNumberId),
                WHATSAPP_OTP_TEMPLATE_NAME: Boolean(templateName),
              },
            }),
      });
    }

    const pool = getPool();

    // Create OTP table (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_requests (
        id BIGSERIAL PRIMARY KEY,
        whatsapp TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otp_requests_whatsapp_created ON otp_requests(whatsapp, created_at DESC);
    `);

    // Basic rate limit: max 3 sends per hour per number
    const rateRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt
       FROM otp_requests
       WHERE whatsapp = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [whatsapp]
    );
    const recent = Number(rateRes.rows?.[0]?.cnt ?? 0);
    if (recent >= 3) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Please wait before requesting another code.",
      });
    }

    const ttlSeconds = 5 * 60;
    const otp = makeOtp(6);

    const pepper = process.env.OTP_PEPPER || "";
    const otpHash = sha256(`${whatsapp}:${otp}:${pepper}`);

    await pool.query(
      `INSERT INTO otp_requests (whatsapp, otp_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3::int * INTERVAL '1 second'))`,
      [whatsapp, otpHash, ttlSeconds]
    );

    await sendWhatsAppOtpTemplateMessage({
      token,
      phoneNumberId,
      apiVersion,
      to: whatsapp,
      templateName,
      languageCode,
      otp,
      ttlSeconds,
    });

    return res.status(200).json({ ok: true, ttlSeconds });
  } catch (err: any) {
    return res.status(500).json({
      error: "OTP start failed",
      ...(isProd
        ? {}
        : {
            debug: {
              message: err?.message,
              stack: err?.stack,
            },
          }),
    });
  }
}
