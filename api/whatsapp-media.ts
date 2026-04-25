import { z } from "zod";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";

// --- Voucher card generation (server-side) ---

function getVoucherCardTemplatePath() {
  const url = new URL("../public/voucher_template.png", import.meta.url);
  return fileURLToPath(url);
}

async function fetchAsBuffer(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to download: ${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Creates a ready-to-send voucher card image (PNG) by drawing onto the fixed template.
 * STRICT: does not alter any template pixels except where we draw the new code + QR.
 * Output resolution matches template (2048×1214).
 */
export async function renderVoucherCardPng(opts: { code: string; qrUrl: string }) {
  // Fixed template spec
  const W = 2048;
  const H = 1214;

  // Voucher code bounding box
  const CODE_BOX = {
    x1: 420,
    y1: 930,
    x2: 980,
    y2: 1040,
  };

  const qrLeft = 1030;
  const qrTop = 925;
  const qrSize = 110;

  const templatePath = getVoucherCardTemplatePath();

  // Draw base template 1:1
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const templateImg = await loadImage(templatePath);
  ctx.drawImage(templateImg, 0, 0, W, H);

  // --- QR overlay ---
  // Keep QR sharp: disable smoothing for resampling
  const qrBuf = await fetchAsBuffer(opts.qrUrl);
  const qrImg = await loadImage(qrBuf);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Place exactly as specified
  ctx.drawImage(qrImg, qrLeft, qrTop, qrSize, qrSize);
  ctx.restore();

  // --- Voucher code text overlay ---
  // Styling per spec
  const color = "#0b1a3a";
  const fontSize = 46; // within 42–48
  const fontWeight = 600; // semi-bold

  // Text-safe area with padding
  const padX = 26; // ~20–30
  const safeX1 = CODE_BOX.x1 + padX;
  const safeX2 = CODE_BOX.x2 - padX;

  // Slightly above vertical center for balance
  const boxH = CODE_BOX.y2 - CODE_BOX.y1;
  const baselineY = Math.round(CODE_BOX.y1 + boxH * 0.58);

  ctx.save();
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `${fontWeight} ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;

  // If text too long, reduce font size down to 42
  const maxWidth = safeX2 - safeX1;
  let finalFontSize = fontSize;
  for (; finalFontSize >= 42; finalFontSize--) {
    ctx.font = `${fontWeight} ${finalFontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
    const w = ctx.measureText(opts.code).width;
    if (w <= maxWidth) break;
  }

  // Alignment rule: left-aligned OR center depending on length
  const measured = ctx.measureText(opts.code).width;
  const useCenter = measured < maxWidth * 0.62;
  if (useCenter) {
    ctx.textAlign = "center";
    const cx = Math.round((safeX1 + safeX2) / 2);
    ctx.fillText(opts.code, cx, baselineY);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(opts.code, safeX1, baselineY);
  }

  ctx.restore();

  // Ensure we didn't draw outside intended regions (best-effort check: keep within boxes)
  // NOTE: Canvas can't easily assert pixel bounds here; we rely on fixed coordinates only.
  // QR is guaranteed inside QR box by config; text is bounded by padding + font-fit.

  // Output PNG at full resolution
  return canvas.toBuffer("image/png");
}

const metaErrorSchema = z
  .object({
    error: z
      .object({
        message: z.string().optional(),
        type: z.string().optional(),
        code: z.number().optional(),
        error_subcode: z.number().optional(),
        fbtrace_id: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export function normalizeToDigits(to: string) {
  return to.replace(/\s+/g, "").replace(/^\+/, "");
}

export async function downloadAsBlob(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to download media: ${r.status}`);
  return await r.blob();
}

export async function uploadWhatsAppMedia(opts: {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
  file: Blob;
  filename: string;
  mimeType: string;
}) {
  const endpoint = `https://graph.facebook.com/${opts.apiVersion}/${encodeURIComponent(opts.phoneNumberId)}/media`;

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  // Graph expects 'file'
  form.append("file", opts.file, opts.filename);
  form.append("type", opts.mimeType);

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
    body: form,
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const parsedErr = metaErrorSchema.safeParse(data);
    throw new Error(
      `Media upload failed (${r.status}): ${
        (parsedErr.success && parsedErr.data.error?.message) || (data as any)?.error?.message || "Unknown error"
      }`
    );
  }

  const id = (data as any)?.id as string | undefined;
  if (!id) throw new Error("Media upload response missing id");
  return { id, raw: data };
}

export async function sendWhatsAppImageMessage(opts: {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
  to: string;
  mediaId: string;
  caption?: string;
}) {
  const endpoint = `https://graph.facebook.com/${opts.apiVersion}/${encodeURIComponent(opts.phoneNumberId)}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: normalizeToDigits(opts.to),
    type: "image",
    image: {
      id: opts.mediaId,
      ...(opts.caption ? { caption: opts.caption } : {}),
    },
  } as const;

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const parsedErr = metaErrorSchema.safeParse(data);
    throw new Error(
      `Image send failed (${r.status}): ${
        (parsedErr.success && parsedErr.data.error?.message) || (data as any)?.error?.message || "Unknown error"
      }`
    );
  }

  return { ok: true as const, raw: data };
}

export async function sendWhatsAppTemplateMessage(opts: {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
  templateName: string;
  languageCode: string;
  to: string;
  parameters: Array<{ type: "text"; text: string }>;
}) {
  const endpoint = `https://graph.facebook.com/${opts.apiVersion}/${encodeURIComponent(opts.phoneNumberId)}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: normalizeToDigits(opts.to),
    type: "template",
    template: {
      name: opts.templateName,
      language: { code: opts.languageCode },
      components: [
        {
          type: "body",
          parameters: opts.parameters,
        },
      ],
    },
  } as const;

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const parsedErr = metaErrorSchema.safeParse(data);
    throw new Error(
      `Template send failed (${r.status}): ${
        (parsedErr.success && parsedErr.data.error?.message) || (data as any)?.error?.message || "Unknown error"
      }`
    );
  }

  return { ok: true as const, raw: data };
}
