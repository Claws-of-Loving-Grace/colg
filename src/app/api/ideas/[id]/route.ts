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

  const idea = {
    ...ideaRow,
    tags: parseJson<Record<string, string>>(ideaRow.tags, {}),
    score_components: parseJson<Record<string, number>>(ideaRow.score_components, {}),
    clarifying_questions: parseJson<string[]>(ideaRow.clarifying_questions, []),
    clarifying_responses: parseJson<string[]>(ideaRow.clarifying_responses, []),
  };

  return NextResponse.json({ idea });
}
