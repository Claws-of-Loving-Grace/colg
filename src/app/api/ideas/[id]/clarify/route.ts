import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { scanText } from "@/middleware/scan";

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { env } = getCloudflareContext();
  const params = await context.params;
  const ideaId = params?.id;

  if (!ideaId) {
    return NextResponse.json({ error: "Missing idea id" }, { status: 400 });
  }

  let payload: { responses?: string[] } | null = null;
  try {
    payload = (await request.json()) as { responses?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ideaRow = await env.DB.prepare(
    `SELECT clarifying_questions, clarifying_responses FROM ideas WHERE id = ?`,
  )
    .bind(ideaId)
    .first<{ clarifying_questions: string | null; clarifying_responses: string | null }>();

  if (!ideaRow) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const questions = parseJson<string[]>(ideaRow.clarifying_questions, []);
  if (questions.length === 0) {
    return NextResponse.json({ error: "No clarifying questions" }, { status: 400 });
  }

  const responses = Array.isArray(payload.responses)
    ? payload.responses.map((item) => (typeof item === "string" ? item.trim() : ""))
    : [];

  const hasAnswer = responses.some((item) => item.length > 0);
  if (!hasAnswer) {
    return NextResponse.json({ error: "Missing responses" }, { status: 400 });
  }

  if (responses.length > questions.length) {
    return NextResponse.json({ error: "Too many responses" }, { status: 400 });
  }

  for (const responseText of responses) {
    if (!responseText) continue;
    const result = await scanText(env, responseText);
    if (!result.ok) {
      return NextResponse.json({ error: "Content rejected" }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const responsePayload = JSON.stringify(responses);

  await env.DB.prepare(
    `UPDATE ideas
      SET clarifying_responses = ?,
          updated_at = ?
      WHERE id = ?`,
  )
    .bind(responsePayload, now, ideaId)
    .run();

  return NextResponse.json({
    clarifying_questions: questions,
    clarifying_responses: responses,
    updated_at: now,
  });
}
