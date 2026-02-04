import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ulid } from "@/lib/ulid";
import { scanText } from "@/middleware/scan";

type RegisterPayload = {
  label?: string;
  contact?: string;
};

function normalize(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function hashToken(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(request: Request) {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) return direct;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return null;
}

async function enforceRateLimit(kv: CloudflareEnv["RATE_LIMIT"], ip: string | null) {
  if (!kv || !ip) {
    return { ok: true };
  }
  const bucket = Math.floor(Date.now() / 3_600_000);
  const key = `bot-reg:${ip}:${bucket}`;
  const current = Number((await kv.get(key)) ?? "0");
  if (current >= 3) {
    return { ok: false };
  }
  await kv.put(key, String(current + 1), { expirationTtl: 3600 });
  return { ok: true };
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext();

  const rate = await enforceRateLimit(env.RATE_LIMIT, getClientIp(request));
  if (!rate.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let payload: RegisterPayload | null = null;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const label = normalize(payload.label);
  const contact = normalize(payload.contact);

  if (!label) {
    return NextResponse.json({ error: "Missing label" }, { status: 400 });
  }
  if (label.length > 80 || contact.length > 200) {
    return NextResponse.json({ error: "Field too long" }, { status: 400 });
  }

  for (const value of [label, contact].filter(Boolean)) {
    const result = await scanText(env, value);
    if (!result.ok) {
      return NextResponse.json({ error: "Content rejected" }, { status: 400 });
    }
  }

  const key = `bot_${ulid()}`;
  const keyHash = await hashToken(key);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO bot_keys (id, key_hash, label, contact, created_at)
      VALUES (?, ?, ?, ?, ?)`
  )
    .bind(ulid(), keyHash, label, contact || null, now)
    .run();

  return NextResponse.json({
    key,
    label,
    created_at: now,
  });
}
