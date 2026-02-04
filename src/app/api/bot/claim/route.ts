import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireBotAuth } from "../auth";
import { ulid } from "@/lib/ulid";

type ClaimPayload = {
  idea_id?: string;
  agent_id?: string;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

const ACTIVE_STATUSES = ["in_progress", "review", "merged"] as const;

export async function POST(request: Request) {
  const auth = await requireBotAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();

  let payload: ClaimPayload | null = null;
  try {
    payload = (await request.json()) as ClaimPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ideaId = normalizeString(payload.idea_id);
  const agentId = normalizeString(payload.agent_id);

  if (!ideaId) {
    return NextResponse.json({ error: "Missing idea_id" }, { status: 400 });
  }
  if (!agentId) {
    return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });
  }

  const idea = await env.DB.prepare(
    "SELECT id, status FROM ideas WHERE id = ? LIMIT 1",
  )
    .bind(ideaId)
    .first<{ id: string; status: string }>();

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (idea.status !== "queued") {
    return NextResponse.json({ error: "Idea not available" }, { status: 409 });
  }

  const agentActive = await env.DB.prepare(
    `SELECT id FROM build_artifacts WHERE agent_id = ? AND status IN (${ACTIVE_STATUSES.map(
      () => "?",
    ).join(", ")}) LIMIT 1`,
  )
    .bind(agentId, ...ACTIVE_STATUSES)
    .first<{ id: string }>();

  if (agentActive) {
    return NextResponse.json({ error: "Agent already has active claim" }, { status: 409 });
  }

  const ideaActive = await env.DB.prepare(
    `SELECT id FROM build_artifacts WHERE idea_id = ? AND status IN (${ACTIVE_STATUSES.map(
      () => "?",
    ).join(", ")}) LIMIT 1`,
  )
    .bind(ideaId, ...ACTIVE_STATUSES)
    .first<{ id: string }>();

  if (ideaActive) {
    return NextResponse.json({ error: "Idea already claimed" }, { status: 409 });
  }

  const artifactId = ulid();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO build_artifacts (
      id,
      idea_id,
      agent_id,
      pr_url,
      deploy_url,
      status,
      claimed_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      artifactId,
      ideaId,
      agentId,
      null,
      null,
      "in_progress",
      now,
      null,
    )
    .run();

  await env.DB.prepare(
    `UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?`,
  )
    .bind("building", now, ideaId)
    .run();

  return NextResponse.json({
    artifact: {
      id: artifactId,
      idea_id: ideaId,
      agent_id: agentId,
      pr_url: null,
      deploy_url: null,
      status: "in_progress",
      claimed_at: now,
      completed_at: null,
    },
  });
}
