import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const headerSchema = z.object({
  authorization: z.string().optional(),
});

function b64urlDecodeToString(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64").toString("utf8");
}

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function requireAdminAuth(req: { headers?: any }) {
  const parsed = headerSchema.safeParse({ authorization: req?.headers?.authorization });
  const auth = parsed.success ? parsed.data.authorization : undefined;
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return { ok: false as const, status: 500, error: "Missing ADMIN_AUTH_SECRET" };

  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false as const, status: 401, error: "Missing auth token" };
  }

  const token = auth.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false as const, status: 401, error: "Invalid token" };

  const [bodyB64, sig] = parts;
  const expectedSig = b64url(createHmac("sha256", secret).update(bodyB64).digest());
  if (!safeEq(sig, expectedSig)) return { ok: false as const, status: 401, error: "Invalid token" };

  let payload: any;
  try {
    payload = JSON.parse(b64urlDecodeToString(bodyB64));
  } catch {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  if (!payload?.exp || typeof payload.exp !== "number") {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    return { ok: false as const, status: 401, error: "Token expired" };
  }

  return { ok: true as const, payload };
}
