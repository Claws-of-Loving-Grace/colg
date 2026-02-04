import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdminAuth } from "../../auth";

type ArtifactUpdatePayload = {
  status?: string;
};

const ALLOWED_STATUSES = ["merged", "rejected"] as const;

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();
  const params = await context.params;
  const artifactId = params?.id;

  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifact id" }, { status: 400 });
  }

  let payload: ArtifactUpdatePayload | null = null;
  try {
    payload = (await request.json()) as ArtifactUpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const requestedStatus = normalizeString(payload.status);
  if (!requestedStatus) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  if (!ALLOWED_STATUSES.includes(requestedStatus as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT id, idea_id, status FROM build_artifacts WHERE id = ? LIMIT 1",
  )
    .bind(artifactId)
    .first<{ id: string; idea_id: string; status: string }>();

  if (!existing) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  if (existing.status !== "review") {
    return NextResponse.json({ error: "Artifact not in review" }, { status: 409 });
  }

  const now = new Date().toISOString();

  await env.DB.prepare(
    "UPDATE build_artifacts SET status = ? WHERE id = ?",
  )
    .bind(requestedStatus, artifactId)
    .run();

  if (requestedStatus === "rejected") {
    await env.DB.prepare(
      "UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?",
    )
      .bind("queued", now, existing.idea_id)
      .run();
  }

  return NextResponse.json({
    artifact: {
      id: artifactId,
      status: requestedStatus,
    },
  });
}
