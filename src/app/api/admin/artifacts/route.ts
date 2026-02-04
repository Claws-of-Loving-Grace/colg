import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdminAuth } from "../auth";

type PendingArtifactRow = {
  id: string;
  idea_id: string;
  agent_id: string;
  pr_url: string | null;
  deploy_url: string | null;
  status: string;
  claimed_at: string;
  idea_title: string;
};

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const { env } = getCloudflareContext();

  const artifacts = await env.DB.prepare(
    `SELECT
        b.id,
        b.idea_id,
        b.agent_id,
        b.pr_url,
        b.deploy_url,
        b.status,
        b.claimed_at,
        i.title as idea_title
      FROM build_artifacts b
      JOIN ideas i ON i.id = b.idea_id
      WHERE b.status = ?
      ORDER BY b.claimed_at DESC`,
  )
    .bind("review")
    .all<PendingArtifactRow>();

  return NextResponse.json({
    artifacts: artifacts.results ?? [],
  });
}
