import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { scanText } from "@/middleware/scan";
import { ulid } from "@/lib/ulid";

export const runtime = "edge";

type IdeaPayload = {
  title: string;
  problem: string;
  who_it_helps: string;
  mvp_scope: string;
  success_metric: string;
  constraints?: string;
  links?: string;
  submitter_email?: string;
};

type RequiredField = "title" | "problem" | "who_it_helps" | "mvp_scope";

const REQUIRED_FIELDS: RequiredField[] = ["title", "problem", "who_it_helps", "mvp_scope"];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const key = `rl:${ip}:${bucket}`;
  const current = Number((await kv.get(key)) ?? "0");
  if (current >= 5) {
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

  let payload: Partial<IdeaPayload> | null = null;
  try {
    payload = (await request.json()) as Partial<IdeaPayload>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sanitized: IdeaPayload = {
    title: "",
    problem: "",
    who_it_helps: "",
    mvp_scope: "",
    success_metric: "",
    constraints: undefined,
    links: undefined,
    submitter_email: undefined,
  };

  for (const field of REQUIRED_FIELDS) {
    const raw = typeof payload[field] === "string" ? payload[field] : "";
    const trimmed = raw.trim();
    if (!trimmed) {
      return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
    }
    sanitized[field] = escapeHtml(trimmed);
  }

  const optionalFields: Array<keyof IdeaPayload> = [
    "constraints",
    "links",
    "submitter_email",
    "success_metric",
  ];
  for (const field of optionalFields) {
    const raw = typeof payload[field] === "string" ? payload[field] : "";
    const trimmed = raw.trim();
    if (trimmed) {
      sanitized[field] = escapeHtml(trimmed);
    }
  }

  const scanFields = Object.entries(sanitized)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([, value]) => value as string);

  for (const value of scanFields) {
    const result = await scanText(env, value);
    if (!result.ok) {
      return NextResponse.json({ error: "Content rejected" }, { status: 400 });
    }
  }

  const id = ulid();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO ideas (
      id,
      title,
      problem,
      who_it_helps,
      mvp_scope,
      success_metric,
      constraints,
      links,
      status,
      tags,
      score,
      submitter_email,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      sanitized.title,
      sanitized.problem,
      sanitized.who_it_helps,
      sanitized.mvp_scope,
      sanitized.success_metric,
      sanitized.constraints ?? null,
      sanitized.links ?? null,
      "submitted",
      null,
      null,
      sanitized.submitter_email ?? null,
      now,
      now
    )
    .run();

  return NextResponse.json(
    {
      idea: {
        id,
        ...sanitized,
        status: "submitted",
        created_at: now,
        updated_at: now,
      },
    },
    { status: 201 }
  );
}
