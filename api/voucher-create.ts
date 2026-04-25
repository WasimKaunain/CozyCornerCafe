import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getPool } from "./_db";
import { withCors } from "./_cors";
import { customAlphabet } from "nanoid";
import {
  downloadAsBlob,
  uploadWhatsAppMedia,
  sendWhatsAppImageMessage,
  renderVoucherCardPng,
  sendWhatsAppTemplateMessage,
} from "./whatsapp-media";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9]{8,20}$/, "Invalid phone number"),
});

const nano = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

function voucherCode() {
  return nano();
}

// Valid till 3rd May midnight (23:59:59) in Asia/Riyadh
function validityEnd() {
  // NOTE: JS Date uses local timezone on server; Vercel runs UTC.
  // We'll create 2026-05-03T23:59:59 in Asia/Riyadh by subtracting 3 hours (UTC+3).
  // Riyadh is UTC+3 (no DST).
  const utc = new Date(Date.UTC(2026, 4, 3, 20, 59, 59));
  return utc;
}

function buildCounterQrUrl(code: string) {
  // Encodes only the voucher code (same as /api/voucher-qr?code=...)
  return `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(code)}`;
}

async function sendWhatsAppVoucherCard(opts: {
  to: string;
  name: string;
  code: string;
  validityText: string;
  qrUrl: string;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "voucher_ready";
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

  if (!token || !phoneNumberId) {
    return { ok: false as const, skipped: true as const, reason: "Missing WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID" };
  }

  // 1) Send template text message (best-effort)
  let templateRes: any = null;
  try {
    templateRes = await sendWhatsAppTemplateMessage({
      token,
      phoneNumberId,
      apiVersion,
      templateName,
      languageCode,
      to: opts.to,
      parameters: [
        { type: "text", text: opts.name },
        { type: "text", text: opts.code },
        { type: "text", text: opts.validityText },
      ],
    });
  } catch (e: any) {
    templateRes = { ok: false, error: e?.message || "Template send failed" };
  }

  // 2) Generate voucher card image server-side using the public template
  const png = await renderVoucherCardPng({ code: opts.code, qrUrl: opts.qrUrl });
  const blob = new Blob([png], { type: "image/png" });

  const upload = await uploadWhatsAppMedia({
    token,
    phoneNumberId,
    apiVersion,
    file: blob,
    filename: `voucher-${opts.code}.png`,
    mimeType: "image/png",
  });

  const caption = `Cozy Corner Cafe Voucher\nCode: ${opts.code}\n${opts.validityText}`;

  const imageRes = await sendWhatsAppImageMessage({
    token,
    phoneNumberId,
    apiVersion,
    to: opts.to,
    mediaId: upload.id,
    caption,
  });

  return { ok: true as const, templateRes, upload, imageRes };
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
    const { name, whatsapp } = parsed.data;

    const pool = getPool();

    // Ensure schema exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vouchers (
        id BIGSERIAL PRIMARY KEY,
        customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        code TEXT NOT NULL UNIQUE,
        validity_end TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        used_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS whatsapp_deliveries (
        id BIGSERIAL PRIMARY KEY,
        customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        voucher_id BIGINT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
        to_number TEXT NOT NULL,
        status TEXT NOT NULL,
        provider_message_id TEXT,
        provider_media_id TEXT,
        error_message TEXT,
        provider_payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_whatsapp ON customers(whatsapp);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_vouchers_customer_id ON vouchers(customer_id);
      CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON vouchers(customer_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_voucher_id ON whatsapp_deliveries(voucher_id);
    `);

    // Insert customer (WhatsApp must be unique)
    let customerId: number;
    try {
      const customerRes = await pool.query(
        `INSERT INTO customers (name, whatsapp) VALUES ($1, $2) RETURNING id`,
        [name, whatsapp]
      );
      customerId = customerRes.rows[0]?.id as number;
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "This WhatsApp number has already been used." });
      }
      throw err;
    }

    const validEnd = validityEnd();

    // Insert voucher (retry on code collisions)
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = voucherCode();
      try {
        const voucherRes = await pool.query(
          `INSERT INTO vouchers (customer_id, code, validity_end) VALUES ($1, $2, $3) RETURNING id, code, validity_end, created_at`,
          [customerId, code, validEnd]
        );
        const row = voucherRes.rows[0];

        const validityText = process.env.VOUCHER_VALIDITY_TEXT || "Valid till 3rd May 11:59 PM";
        const counterQrUrl = buildCounterQrUrl(row.code);

        // Best-effort WhatsApp send + audit log
        let waResult: any = null;
        let waSent = false;
        let waStatus = "failed";
        let waErrorMessage: string | null = null;
        let waProviderMessageId: string | null = null;
        let waProviderMediaId: string | null = null;

        try {
          waResult = await sendWhatsAppVoucherCard({
            to: whatsapp,
            name,
            code: row.code,
            validityText,
            qrUrl: counterQrUrl,
          });

          waSent = Boolean(waResult?.ok);
          waStatus = waSent ? "sent" : "failed";

          waProviderMediaId = waResult?.upload?.id || null;

          // Prefer image message id; keep template id in payload (non-prod)
          waProviderMessageId =
            (waResult?.imageRes?.raw as any)?.messages?.[0]?.id ||
            (waResult?.imageRes?.raw as any)?.message_id ||
            (waResult?.templateRes?.raw as any)?.messages?.[0]?.id ||
            null;
        } catch (e: any) {
          waSent = false;
          waStatus = "exception";
          waErrorMessage = e?.message || "Unknown WhatsApp error";
          waResult = { ok: false, exception: true, message: waErrorMessage };
        }

        try {
          await pool.query(
            `INSERT INTO whatsapp_deliveries (
              customer_id, voucher_id, to_number, status, provider_message_id, provider_media_id, error_message, provider_payload
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              customerId,
              row.id,
              whatsapp,
              waStatus,
              waProviderMessageId,
              waProviderMediaId,
              waErrorMessage,
              isProd ? null : waResult,
            ]
          );
        } catch {
          // auditing should never block voucher creation
        }

        return res.status(200).json({
          ok: true,
          voucher: {
            id: row.id,
            code: row.code,
            validityEnd: row.validity_end,
            createdAt: row.created_at,
          },
          customer: { id: customerId, name, whatsapp },
          whatsapp: waSent
            ? { sent: true }
            : {
                sent: false,
                ...(isProd ? {} : { debug: { waResult } }),
              },
        });
      } catch (err: any) {
        const pgCode = err?.code;
        if (pgCode === "23505") {
          // unique violation (likely code collision), retry
          continue;
        }

        return res.status(500).json({
          error: "Database error",
          ...(isProd
            ? {}
            : {
                debug: {
                  message: err?.message,
                  code: err?.code,
                  detail: err?.detail,
                  hint: err?.hint,
                  where: err?.where,
                },
              }),
        });
      }
    }

    return res.status(500).json({ error: "Failed to generate unique voucher" });
  } catch (err: any) {
    // Covers pool init errors and schema creation errors
    return res.status(500).json({
      error: "Function failed",
      ...(isProd
        ? {}
        : {
            debug: {
              message: err?.message,
              code: err?.code,
              detail: err?.detail,
              hint: err?.hint,
              where: err?.where,
              stack: err?.stack,
            },
          }),
    });
  }
}
