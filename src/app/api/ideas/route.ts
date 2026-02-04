import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { scanText } from "@/middleware/scan";
import { ulid } from "@/lib/ulid";

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

const REQUIRED_FIELDS: RequiredField[] = [
  "title",
  "problem",
  "who_it_helps",
  "mvp_scope",
];
const PUBLIC_STATUSES = ["queued", "building", "shipped"] as const;

type SortKey = "votes" | "newest" | "score";

type IdeaListRow = {
  id: string;
  title: string;
  who_it_helps: string;
  mvp_scope: string;
  status: string;
  score: number | null;
  created_at: string;
  updated_at: string;
  vote_count: number;
};

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

function parseStatuses(value: string | null) {
  if (!value || value === "all") {
    return [...PUBLIC_STATUSES];
  }
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => PUBLIC_STATUSES.includes(item as (typeof PUBLIC_STATUSES)[number]));
  return selected.length ? selected : [...PUBLIC_STATUSES];
}

function parseSort(value: string | null): SortKey {
  if (value === "newest" || value === "score") {
    return value;
  }
  return "votes";
}

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.floor(parsed), 1), 50);
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.floor(parsed), 1);
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);

  const statuses = parseStatuses(searchParams.get("status"));
  const sort = parseSort(searchParams.get("sort"));
  const limit = parseLimit(searchParams.get("limit"));
  const page = parsePage(searchParams.get("page"));
  const includeStats = searchParams.get("stats") === "1";

  const offset = (page - 1) * limit;
  const whereClause = `i.status IN (${statuses.map(() => "?").join(", ")})`;

  let orderClause = "vote_count DESC, i.created_at DESC";
  if (sort === "newest") {
    orderClause = "i.created_at DESC";
  }
  if (sort === "score") {
    orderClause =
      "(i.score IS NULL) ASC, i.score DESC, vote_count DESC, i.created_at DESC";
  }

  const ideasQuery = `
    SELECT
      i.id,
      i.title,
      i.who_it_helps,
      i.mvp_scope,
      i.status,
      i.score,
      i.created_at,
      i.updated_at,
      COUNT(v.id) AS vote_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    WHERE ${whereClause}
    GROUP BY i.id
    ORDER BY ${orderClause}
    LIMIT ?
    OFFSET ?
  `;

  const ideasResult = await env.DB.prepare(ideasQuery)
    .bind(...statuses, limit, offset)
    .all<IdeaListRow>();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM ideas i WHERE ${whereClause}`,
  )
    .bind(...statuses)
    .first<{ total: number }>();

  let stats: { ideas: number; votes: number; shipped: number } | undefined;
  if (includeStats) {
    const ideasRow = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM ideas i WHERE i.status IN (${PUBLIC_STATUSES.map(() => "?").join(", ")})`,
    )
      .bind(...PUBLIC_STATUSES)
      .first<{ total: number }>();
    const votesRow = await env.DB.prepare(`SELECT COUNT(*) as total FROM votes`)
      .bind()
      .first<{
        total: number;
      }>();
    const shippedRow = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM ideas i WHERE i.status = ?`,
    )
      .bind("shipped")
      .first<{ total: number }>();

    stats = {
      ideas: ideasRow?.total ?? 0,
      votes: votesRow?.total ?? 0,
      shipped: shippedRow?.total ?? 0,
    };
  }

  return NextResponse.json({
    ideas: ideasResult.results ?? [],
    pagination: {
      page,
      limit,
      total: totalRow?.total ?? 0,
    },
    stats,
  });
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      now,
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
    { status: 201 },
  );
}
