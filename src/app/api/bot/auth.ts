import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const UNAUTHORIZED = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

function extractToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const altHeader = request.headers.get("x-bot-key");
  return altHeader?.trim() ?? "";
}

async function hashToken(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function requireBotAuth(request: Request) {
  const { env } = getCloudflareContext();
  const token = extractToken(request);

  if (!token) {
    return { ok: false, response: UNAUTHORIZED } as const;
  }

  try {
    const tokenHash = await hashToken(token);
    const row = await env.DB.prepare(
      `SELECT id, revoked FROM bot_keys WHERE key_hash = ? LIMIT 1`,
    )
      .bind(tokenHash)
      .first<{ id: string; revoked: number }>();

    if (!row || row.revoked === 1) {
      return { ok: false, response: UNAUTHORIZED } as const;
    }

    const now = new Date().toISOString();
    await env.DB.prepare(`UPDATE bot_keys SET last_used_at = ? WHERE id = ?`)
      .bind(now, row.id)
      .run();

    return { ok: true, token } as const;
  } catch {
    return { ok: false, response: UNAUTHORIZED } as const;
  }
}
