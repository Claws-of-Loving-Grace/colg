import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireBotAuth } from "../auth";
import { scanText } from "@/middleware/scan";
import { ulid } from "@/lib/ulid";

type ReceiptPayload = {
  idea_id?: string;
  artifact_id?: string;
  summary?: string;
  metric?: string;
  next_steps?: string;
  shipped_url?: string;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

const APPROVED_STATUSES = ["merged", "deployed"] as const;

export async function POST(request: Request) {
  const auth = await requireBotAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();

  let payload: ReceiptPayload | null = null;
  try {
    payload = (await request.json()) as ReceiptPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ideaId = normalizeString(payload.idea_id);
  const artifactId = normalizeString(payload.artifact_id);
  const summary = normalizeString(payload.summary);
  const metric = normalizeString(payload.metric);
  const nextSteps = normalizeString(payload.next_steps);
  const shippedUrl = normalizeString(payload.shipped_url);

  if (!ideaId) {
    return NextResponse.json({ error: "Missing idea_id" }, { status: 400 });
  }
  if (!artifactId) {
    return NextResponse.json({ error: "Missing artifact_id" }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json({ error: "Missing summary" }, { status: 400 });
  }
  if (!metric) {
    return NextResponse.json({ error: "Missing metric" }, { status: 400 });
  }

  const summaryScan = await scanText(env, summary);
  if (!summaryScan.ok) {
    return NextResponse.json({ error: "Content rejected" }, { status: 400 });
  }

  if (nextSteps) {
    const nextScan = await scanText(env, nextSteps);
    if (!nextScan.ok) {
      return NextResponse.json({ error: "Content rejected" }, { status: 400 });
    }
  }

  const idea = await env.DB.prepare(
    "SELECT id, status FROM ideas WHERE id = ? LIMIT 1",
  )
    .bind(ideaId)
    .first<{ id: string; status: string }>();

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (idea.status !== "building") {
    return NextResponse.json({ error: "Idea not ready" }, { status: 409 });
  }

  const artifact = await env.DB.prepare(
    "SELECT id, idea_id, status FROM build_artifacts WHERE id = ? LIMIT 1",
  )
    .bind(artifactId)
    .first<{ id: string; idea_id: string; status: string }>();

  if (!artifact || artifact.idea_id !== ideaId) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  if (!APPROVED_STATUSES.includes(artifact.status as (typeof APPROVED_STATUSES)[number])) {
    return NextResponse.json({ error: "Artifact not approved" }, { status: 409 });
  }

  const existingReceipt = await env.DB.prepare(
    "SELECT id FROM receipts WHERE idea_id = ? LIMIT 1",
  )
    .bind(ideaId)
    .first<{ id: string }>();

  if (existingReceipt) {
    return NextResponse.json({ error: "Receipt already exists" }, { status: 409 });
  }

  const receiptId = ulid();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO receipts (
      id,
      idea_id,
      artifact_id,
      summary,
      metric,
      next_steps,
      shipped_url,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      receiptId,
      ideaId,
      artifactId,
      summary,
      metric,
      nextSteps || null,
      shippedUrl || null,
      now,
    )
    .run();

  await env.DB.prepare(
    "UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?",
  )
    .bind("shipped", now, ideaId)
    .run();

  return NextResponse.json({
    receipt: {
      id: receiptId,
      idea_id: ideaId,
      artifact_id: artifactId,
      summary,
      metric,
      next_steps: nextSteps || null,
      shipped_url: shippedUrl || null,
      created_at: now,
    },
  });
}
