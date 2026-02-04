import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireBotAuth } from "../auth";

const ALL_STATUSES = [
  "submitted",
  "queued",
  "building",
  "shipped",
  "declined",
] as const;

type BotIdeaRow = {
  id: string;
  title: string;
  problem: string;
  who_it_helps: string;
  mvp_scope: string;
  success_metric: string;
  constraints: string | null;
  links: string | null;
  status: string;
  tags: string | null;
  score: number | null;
  score_components: string | null;
  triage_summary: string | null;
  clarifying_questions: string | null;
  clarifying_responses: string | null;
  dedupe_cluster_id: string | null;
  submitter_email: string | null;
  created_at: string;
  updated_at: string;
  vote_count: number;
};

function parseStatuses(value: string | null) {
  if (!value) return ["queued"];
  if (value === "all") return [...ALL_STATUSES];
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => ALL_STATUSES.includes(item as (typeof ALL_STATUSES)[number]));
  return selected.length ? selected : ["queued"];
}

function parseList(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const auth = await requireBotAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);

  const statuses = parseStatuses(searchParams.get("status"));
  const scopes = parseList(searchParams.get("scope"));
  const types = parseList(searchParams.get("type"));
  const stacks = parseList(searchParams.get("stack"));
  const risks = parseList(searchParams.get("risk"));
  const limit = parseLimit(searchParams.get("limit"));
  const page = parsePage(searchParams.get("page"));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];

  if (statuses.length) {
    where.push(`i.status IN (${statuses.map(() => "?").join(", ")})`);
    params.push(...statuses);
  }
  if (scopes.length) {
    where.push(
      `json_extract(i.tags, '$.scope') IN (${scopes.map(() => "?").join(", ")})`,
    );
    params.push(...scopes);
  }
  if (types.length) {
    where.push(
      `json_extract(i.tags, '$.type') IN (${types.map(() => "?").join(", ")})`,
    );
    params.push(...types);
  }
  if (stacks.length) {
    where.push(
      `json_extract(i.tags, '$.stack') IN (${stacks.map(() => "?").join(", ")})`,
    );
    params.push(...stacks);
  }
  if (risks.length) {
    where.push(
      `json_extract(i.tags, '$.risk') IN (${risks.map(() => "?").join(", ")})`,
    );
    params.push(...risks);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const ideasQuery = `
    SELECT
      i.id,
      i.title,
      i.problem,
      i.who_it_helps,
      i.mvp_scope,
      i.success_metric,
      i.constraints,
      i.links,
      i.status,
      i.tags,
      i.score,
      i.score_components,
      i.triage_summary,
      i.clarifying_questions,
      i.clarifying_responses,
      i.dedupe_cluster_id,
      i.submitter_email,
      i.created_at,
      i.updated_at,
      COUNT(v.id) AS vote_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    ${whereClause}
    GROUP BY i.id
    ORDER BY (i.score IS NULL) ASC, i.score DESC, vote_count DESC, i.created_at DESC
    LIMIT ?
    OFFSET ?
  `;

  const ideasResult = await env.DB.prepare(ideasQuery)
    .bind(...params, limit, offset)
    .all<BotIdeaRow>();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM ideas i ${whereClause}`,
  )
    .bind(...params)
    .first<{ total: number }>();

  const ideas = (ideasResult.results ?? []).map((idea) => ({
    ...idea,
    tags: parseJson<Record<string, string>>(idea.tags, {}),
    score_components: parseJson<Record<string, number>>(idea.score_components, {}),
    clarifying_questions: parseJson<string[]>(idea.clarifying_questions, []),
    clarifying_responses: parseJson<string[]>(idea.clarifying_responses, []),
  }));

  return NextResponse.json({
    ideas,
    pagination: {
      page,
      limit,
      total: totalRow?.total ?? 0,
    },
  });
}
