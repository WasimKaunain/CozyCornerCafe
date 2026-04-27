import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { withCors } from "./_cors.js";

const bodySchema = z.object({
  userId: z.string().trim().min(1).max(64),
  password: z.string().trim().min(1).max(128),
});

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(payload: object, secret: string) {
  const bodyB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(createHmac("sha256", secret).update(bodyB64).digest());
  return `${bodyB64}.${sig}`;
}

function safeEq(a: string, b: string) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
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
    return res.status(400).json({
      error: "Invalid input",
      details: isProd ? undefined : parsed.error.flatten(),
    });
  }

  const envUserRaw = process.env.ADMIN_CONSOLE_USER;
  const envPassRaw = process.env.ADMIN_CONSOLE_PASS;
  const secretRaw = process.env.ADMIN_CONSOLE_AUTH_SECRET;

  if (!envUserRaw || !envPassRaw || !secretRaw) {
    const missing = [
      !envUserRaw ? "ADMIN_CONSOLE_USER" : null,
      !envPassRaw ? "ADMIN_CONSOLE_PASS" : null,
      !secretRaw ? "ADMIN_CONSOLE_AUTH_SECRET" : null,
    ].filter(Boolean);

    return res.status(500).json({
      error: `Missing environment variables: ${missing.join(", ")}`,
    });
  }

  const expectedUser = String(envUserRaw).trim();
  const expectedPass = String(envPassRaw).trim();
  const secret = String(secretRaw);

  const providedUser = String(parsed.data.userId).trim();
  const providedPass = String(parsed.data.password).trim();

  // Safe debug info (do not log secrets)
  console.log("[admin-console-login] attempt", {
    hasUser: Boolean(envUserRaw),
    hasPass: Boolean(envPassRaw),
    hasSecret: Boolean(secretRaw),
    providedUserLen: providedUser.length,
    providedPassLen: providedPass.length,
  });

  if (!safeEq(providedUser, expectedUser) || !safeEq(providedPass, expectedPass)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 1 day TTL
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const token = sign({ exp, role: "admin_console" }, secret);

  return res.status(200).json({ ok: true, token, exp });
}
