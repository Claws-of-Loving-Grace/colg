import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const PUBLIC_STATUSES = ["queued", "building", "shipped"] as const;

type IdeaDetailRow = {
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

type BuildArtifactRow = {
  id: string;
  agent_id: string;
  pr_url: string | null;
  deploy_url: string | null;
  status: string;
  claimed_at: string;
  completed_at: string | null;
};

type ReceiptRow = {
  id: string;
  artifact_id: string;
  summary: string;
  metric: string;
  next_steps: string | null;
  shipped_url: string | null;
  created_at: string;
};

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { env } = getCloudflareContext();
  const params = await context.params;
  const ideaId = params?.id;

  if (!ideaId) {
    return NextResponse.json({ error: "Missing idea id" }, { status: 400 });
  }

  const ideaQuery = `
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
    WHERE i.id = ? AND i.status IN (${PUBLIC_STATUSES.map(() => "?").join(", ")})
    GROUP BY i.id
  `;

  const ideaRow = await env.DB.prepare(ideaQuery)
    .bind(ideaId, ...PUBLIC_STATUSES)
    .first<IdeaDetailRow>();

  if (!ideaRow) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const artifactRow = await env.DB.prepare(
    `SELECT id, agent_id, pr_url, deploy_url, status, claimed_at, completed_at
     FROM build_artifacts
     WHERE idea_id = ?
     ORDER BY claimed_at DESC
     LIMIT 1`,
  )
    .bind(ideaId)
    .first<BuildArtifactRow>();

  const receiptRow = await env.DB.prepare(
    `SELECT id, artifact_id, summary, metric, next_steps, shipped_url, created_at
     FROM receipts
     WHERE idea_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
  )
    .bind(ideaId)
    .first<ReceiptRow>();

  const idea = {
    ...ideaRow,
    tags: parseJson<Record<string, string>>(ideaRow.tags, {}),
    score_components: parseJson<Record<string, number>>(ideaRow.score_components, {}),
    clarifying_questions: parseJson<string[]>(ideaRow.clarifying_questions, []),
    clarifying_responses: parseJson<string[]>(ideaRow.clarifying_responses, []),
    build_artifact: artifactRow ?? null,
    receipt: receiptRow ?? null,
  };

  return NextResponse.json({ idea });
}
