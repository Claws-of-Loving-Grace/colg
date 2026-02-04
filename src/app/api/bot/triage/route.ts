import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireBotAuth } from "../auth";
import { scanText } from "@/middleware/scan";

type TriagePayload = {
  idea_id?: string;
  tags?: {
    scope?: string;
    type?: string;
    stack?: string;
    risk?: string;
  };
  triage_summary?: string;
  score_components?: {
    leaderboard_signal?: number;
    expected_impact?: number;
    feasibility?: number;
    agent_fit?: number;
    cost?: number;
    risk?: number;
  };
  clarifying_questions?: string[];
  dedupe_cluster_id?: string;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function ensureNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function POST(request: Request) {
  const auth = await requireBotAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();

  let payload: TriagePayload | null = null;
  try {
    payload = (await request.json()) as TriagePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ideaId = normalizeString(payload.idea_id);
  if (!ideaId) {
    return NextResponse.json({ error: "Missing idea_id" }, { status: 400 });
  }

  const score = payload.score_components ?? {};
  const leaderboardSignal = ensureNumber(score.leaderboard_signal);
  const expectedImpact = ensureNumber(score.expected_impact);
  const feasibility = ensureNumber(score.feasibility);
  const agentFit = ensureNumber(score.agent_fit);
  const cost = ensureNumber(score.cost);
  const risk = ensureNumber(score.risk);

  if (
    leaderboardSignal === null ||
    expectedImpact === null ||
    feasibility === null ||
    agentFit === null ||
    cost === null ||
    risk === null
  ) {
    return NextResponse.json({ error: "Invalid score_components" }, { status: 400 });
  }

  const rawQuestions = payload.clarifying_questions;
  const hasQuestions = Array.isArray(rawQuestions);
  const questions = hasQuestions
    ? rawQuestions.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];

  if (questions.length > 2) {
    return NextResponse.json({ error: "Too many clarifying questions" }, { status: 400 });
  }

  for (const question of questions) {
    const result = await scanText(env, question);
    if (!result.ok) {
      return NextResponse.json({ error: "Content rejected" }, { status: 400 });
    }
  }

  const tags = payload.tags ?? {};
  const requiredTagKeys = ["scope", "type", "stack", "risk"] as const;
  const normalizedTags: Record<string, string> = {};
  for (const key of requiredTagKeys) {
    const trimmed = normalizeString(tags[key]);
    if (!trimmed) {
      return NextResponse.json({ error: `Missing tag ${key}` }, { status: 400 });
    }
    normalizedTags[key] = trimmed;
  }

  const triageSummary = normalizeString(payload.triage_summary);
  const dedupeClusterId = normalizeString(payload.dedupe_cluster_id);
  const totalScore =
    leaderboardSignal + expectedImpact + feasibility + agentFit - cost - risk;
  const now = new Date().toISOString();

  const existing = await env.DB.prepare(
    `SELECT id, clarifying_questions, clarifying_responses FROM ideas WHERE id = ?`,
  )
    .bind(ideaId)
    .first<{
      id: string;
      clarifying_questions: string | null;
      clarifying_responses: string | null;
    }>();

  if (!existing) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const questionPayload = hasQuestions
    ? questions.length
      ? JSON.stringify(questions)
      : null
    : existing.clarifying_questions;
  const tagsPayload = JSON.stringify(normalizedTags);
  const scoreComponentsPayload = JSON.stringify({
    leaderboard_signal: leaderboardSignal,
    expected_impact: expectedImpact,
    feasibility,
    agent_fit: agentFit,
    cost,
    risk,
  });

  const clarifyingResponsesPayload = hasQuestions ? null : existing.clarifying_responses;

  await env.DB.prepare(
    `UPDATE ideas
      SET tags = ?,
          score = ?,
          score_components = ?,
          triage_summary = ?,
          clarifying_questions = ?,
          clarifying_responses = ?,
          dedupe_cluster_id = ?,
          updated_at = ?
      WHERE id = ?`,
  )
    .bind(
      tagsPayload,
      totalScore,
      scoreComponentsPayload,
      triageSummary || null,
      questionPayload,
      clarifyingResponsesPayload,
      dedupeClusterId || null,
      now,
      ideaId,
    )
    .run();

  const responseQuestions = hasQuestions
    ? questions
    : (() => {
        try {
          return existing.clarifying_questions
            ? (JSON.parse(existing.clarifying_questions) as string[])
            : [];
        } catch {
          return [];
        }
      })();

  return NextResponse.json({
    idea: {
      id: ideaId,
      tags: tagsPayload ? normalizedTags : {},
      score: totalScore,
      score_components: {
        leaderboard_signal: leaderboardSignal,
        expected_impact: expectedImpact,
        feasibility,
        agent_fit: agentFit,
        cost,
        risk,
      },
      triage_summary: triageSummary || null,
      clarifying_questions: responseQuestions,
      dedupe_cluster_id: dedupeClusterId || null,
      updated_at: now,
    },
  });
}
