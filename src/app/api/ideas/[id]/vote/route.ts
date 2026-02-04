import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ulid } from "@/lib/ulid";

const COOKIE_NAME = "colg_voter_id";

async function getVoterId() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
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

  const ideaRow = await env.DB.prepare(
    "SELECT id, status FROM ideas WHERE id = ? AND status IN ('queued', 'building', 'shipped')",
  )
    .bind(ideaId)
    .first<{ id: string; status: string }>();

  if (!ideaRow) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  let voterId = await getVoterId();
  let setCookie = false;
  if (!voterId) {
    voterId = ulid();
    setCookie = true;
  }

  const voteId = ulid();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      "INSERT INTO votes (id, idea_id, voter_id, created_at) VALUES (?, ?, ?, ?)",
    )
      .bind(voteId, ideaId, voterId, now)
      .run();
  } catch {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true, idea_id: ideaId });
  if (setCookie && voterId) {
    response.cookies.set({
      name: COOKIE_NAME,
      value: voterId,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
