import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireBotAuth } from "../auth";

type ArtifactPayload = {
  artifact_id?: string;
  agent_id?: string;
  pr_url?: string | null;
  deploy_url?: string | null;
  status?: string;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

const ALLOWED_STATUSES = ["in_progress", "review", "merged", "deployed"] as const;

type ArtifactRow = {
  id: string;
  idea_id: string;
  agent_id: string;
  pr_url: string | null;
  deploy_url: string | null;
  status: string;
  claimed_at: string;
  completed_at: string | null;
};

export async function POST(request: Request) {
  const auth = await requireBotAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();

  let payload: ArtifactPayload | null = null;
  try {
    payload = (await request.json()) as ArtifactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const artifactId = normalizeString(payload.artifact_id);
  const agentId = normalizeString(payload.agent_id);

  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifact_id" }, { status: 400 });
  }
  if (!agentId) {
    return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    `SELECT id, idea_id, agent_id, pr_url, deploy_url, status, claimed_at, completed_at
     FROM build_artifacts WHERE id = ? LIMIT 1`,
  )
    .bind(artifactId)
    .first<ArtifactRow>();

  if (!existing) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  if (existing.agent_id !== agentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status === "rejected") {
    return NextResponse.json({ error: "Artifact rejected" }, { status: 409 });
  }

  const requestedStatus = payload.status ? normalizeString(payload.status) : "";
  let nextStatus = existing.status;
  if (requestedStatus) {
    if (!ALLOWED_STATUSES.includes(requestedStatus as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (existing.status === "deployed" && requestedStatus !== "deployed") {
      return NextResponse.json({ error: "Artifact already deployed" }, { status: 409 });
    }
    nextStatus = requestedStatus;
  }

  const hasPr = Object.prototype.hasOwnProperty.call(payload, "pr_url");
  const hasDeploy = Object.prototype.hasOwnProperty.call(payload, "deploy_url");
  const nextPr = hasPr ? normalizeString(payload.pr_url) : existing.pr_url ?? "";
  const nextDeploy = hasDeploy
    ? normalizeString(payload.deploy_url)
    : existing.deploy_url ?? "";

  const normalizedPr = nextPr ? nextPr : null;
  const normalizedDeploy = nextDeploy ? nextDeploy : null;

  const now = new Date().toISOString();
  const completedAt = nextStatus === "deployed" ? now : existing.completed_at;

  await env.DB.prepare(
    `UPDATE build_artifacts
      SET pr_url = ?,
          deploy_url = ?,
          status = ?,
          completed_at = ?
      WHERE id = ?`,
  )
    .bind(normalizedPr, normalizedDeploy, nextStatus, completedAt, artifactId)
    .run();

  return NextResponse.json({
    artifact: {
      id: artifactId,
      idea_id: existing.idea_id,
      agent_id: existing.agent_id,
      pr_url: normalizedPr,
      deploy_url: normalizedDeploy,
      status: nextStatus,
      claimed_at: existing.claimed_at,
      completed_at: completedAt,
    },
  });
}
