import { z } from "zod";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

// --- Voucher card generation (server-side) ---

function getVoucherCardTemplatePath() {
  // Vercel serverless bundles often place this module at /var/task/api/*.js
  // and assets from /public are copied to the bundle root as well.
  // Resolve from the current module's directory to find: /var/task/public/voucher_template.png
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return join(moduleDir, "..", "public", "voucher_template.png");
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
 * STRICT: does not alter any template pixels except where we draw the new code + QR + offer.
 * Output resolution matches template.
 */
export async function renderVoucherCardPng(opts: { code: string; qrUrl: string; offerText?: string }) {
  // Fixed template spec (UPDATED)
  const W = 1792;
  const H = 1024;

  // Coordinates (UPDATED)
  const OFFER_BOX = { x: 120, y: 520, w: 820, h: 260 };
  const QR_BOX = { x: 500, y: 760, w: 122, h: 125 };
  const VOUCHER_BOX = { x: 330, y: 835, w: 260, h: 90 };

  const templatePath = getVoucherCardTemplatePath();

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const templateImg = await loadImage(templatePath);
  ctx.drawImage(templateImg, 0, 0, W, H);

  // --- QR overlay ---
  const qrBuf = await fetchAsBuffer(opts.qrUrl);
  const qrImg = await loadImage(qrBuf);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Slightly reduce QR size and nudge down-right to fit cleanly inside the blank box
  const qrScale = 0.78;
  const dw = Math.round(QR_BOX.w * qrScale);
  const dh = Math.round(QR_BOX.h * qrScale);
  // Shift QR up/left (~0.5cm ≈ 18–20px at 96DPI; tune here)
  // Re-adjust: move right by ~0.3cm (~11px) and down by ~0.1cm (~4px)
  const qrNudge = { x: QR_BOX.w - 1, y: QR_BOX.h - 12 };
  ctx.drawImage(qrImg, QR_BOX.x + qrNudge.x, QR_BOX.y + qrNudge.y, dw, dh);
  ctx.restore();

  // --- Offer text overlay ---
  if (opts.offerText) {
    const offerColor = "#0b1a3a";
    const offerWeight = 700;

    // Rules: slightly larger font, line height 1.35, wrap, max 6–8 lines
    const maxLines = 8;
    const minFont = 26;
    const maxFont = 30;
    const lineHeightMult = 1.35;

    const pad = 40;
    const safeX1 = OFFER_BOX.x + pad;
    const safeX2 = OFFER_BOX.x + OFFER_BOX.w - pad;
    const safeY1 = OFFER_BOX.y + pad;
    const safeY2 = OFFER_BOX.y + OFFER_BOX.h - pad;

    const maxWidth = safeX2 - safeX1;
    const maxHeight = safeY2 - safeY1;

    // Header + body
    const headerText = "OFFER DETAIL";
    const normalized = opts.offerText.replace(/\s+/g, " ").trim();
    const words = normalized.split(" ");

    function setFont(px: number) {
      // Use a nicer serif stack (matches your Google fonts on the web page)
      ctx.font = `${offerWeight} ${px}px "Playfair Display", "Cinzel", ui-serif, Georgia, "Times New Roman", serif`;
    }

    function wrapToLines(px: number) {
      setFont(px);
      const lines: string[] = [];
      let line = "";

      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (ctx.measureText(next).width <= maxWidth) {
          line = next;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    ctx.save();
    ctx.fillStyle = offerColor;
    ctx.textBaseline = "alphabetic";

    // Prefer 26px, fallback to 25/24 if height doesn't fit
    let fontPx = maxFont;
    let lines = wrapToLines(fontPx);

    for (; fontPx >= minFont; fontPx--) {
      lines = wrapToLines(fontPx);
      const lineH = Math.round(fontPx * lineHeightMult);
      // + header line
      const neededH = (1 + Math.min(lines.length, maxLines)) * lineH;
      if (neededH <= maxHeight) break;
    }

    // Enforce max line count, truncate last line with ellipsis if still too many
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[lines.length - 1];
      setFont(fontPx);
      while (last.length > 0 && ctx.measureText(last + "…").width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[lines.length - 1] = (last || "").replace(/\s+$/, "") + "…";
    }

    const lineH = Math.round(fontPx * lineHeightMult);
    const totalH = (1 + lines.length) * lineH;

    // vertically center inside safe area
    const startY = Math.round(safeY1 + (maxHeight - totalH) / 2 + fontPx);

    setFont(fontPx);
    // Header centered
    ctx.textAlign = "center";
    ctx.fillText(headerText, Math.round((safeX1 + safeX2) / 2), startY);

    // Body left-aligned starting next line
    ctx.textAlign = "left";
    for (let i = 0; i < lines.length; i++) {
      // +2 lines so there is one extra empty line between header and body
      ctx.fillText(lines[i], safeX1, startY + (i + 2) * lineH);
    }

    ctx.restore();
  }

  // --- Voucher code text overlay ---
  {
    const color = "#ffffff";
    const fontPx = 36; // tuned for 260x90 box
    const fontWeight = 800;

    // Shift slightly bottom-left so it doesn't drift to the top-right edge of the box
    const cx = Math.round(VOUCHER_BOX.x + VOUCHER_BOX.w / 2 - 10);
    const cy = Math.round(VOUCHER_BOX.y + VOUCHER_BOX.h / 2 + 14);

    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${fontWeight} ${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;

    // Ensure it fits width (shrink down if needed)
    let finalPx = fontPx;
    for (; finalPx >= 26; finalPx--) {
      ctx.font = `${fontWeight} ${finalPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
      if (ctx.measureText(opts.code).width <= VOUCHER_BOX.w - 20) break;
    }

    // Slight vertical offset (+20)
    const baselineY = Math.round(cy + finalPx * 0.35 + 20);
    ctx.fillText(opts.code, cx, baselineY);
    ctx.restore();
  }

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

export async function sendWhatsAppOtpTemplateMessage(opts: {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
  to: string;
  templateName: string; // must be an APPROVED 'authentication' template
  languageCode: string; // e.g. 'en_US'
  otp: string; // usually 4-8 digits
  ttlSeconds?: number; // optional, if your template supports it
}) {
  const endpoint = `https://graph.facebook.com/${opts.apiVersion}/${encodeURIComponent(opts.phoneNumberId)}/messages`;

  // WhatsApp Authentication templates typically expect a single 'code' parameter.
  // Some accounts/templates support an additional TTL parameter.
  const bodyParams: Array<{ type: "text"; text: string }> = [{ type: "text", text: opts.otp }];
  if (typeof opts.ttlSeconds === "number") {
    bodyParams.push({ type: "text", text: String(opts.ttlSeconds) });
  }

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
          parameters: bodyParams,
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
      `OTP template send failed (${r.status}): ${
        (parsedErr.success && parsedErr.data.error?.message) || (data as any)?.error?.message || "Unknown error"
      }`
    );
  }

  return { ok: true as const, raw: data };
}
