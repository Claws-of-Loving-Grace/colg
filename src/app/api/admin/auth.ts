import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const UNAUTHORIZED = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

function normalizeKeys(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function extractToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const altHeader = request.headers.get("x-admin-key");
  return altHeader?.trim() ?? "";
}

export async function requireAdminAuth(request: Request) {
  const { env } = getCloudflareContext();
  const keys = normalizeKeys(env.ADMIN_API_KEYS);
  const token = extractToken(request);

  if (!token || keys.length === 0) {
    return { ok: false, response: UNAUTHORIZED } as const;
  }

  if (!keys.includes(token)) {
    return { ok: false, response: UNAUTHORIZED } as const;
  }

  return { ok: true, token } as const;
}
