import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type ReceiptListRow = {
  id: string;
  idea_id: string;
  summary: string;
  metric: string;
  shipped_url: string | null;
  created_at: string;
  idea_title: string;
  who_it_helps: string;
  mvp_scope: string;
  deploy_url: string | null;
  next_steps: string | null;
};

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(Math.max(Math.floor(parsed), 1), 50);
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(Math.floor(parsed), 1);
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);

  const limit = parseLimit(searchParams.get("limit"));
  const page = parsePage(searchParams.get("page"));
  const offset = (page - 1) * limit;

  const receipts = await env.DB.prepare(
    `SELECT
      r.id,
      r.idea_id,
      r.summary,
      r.metric,
      r.shipped_url,
      r.created_at,
      r.next_steps,
      i.title as idea_title,
      i.who_it_helps,
      i.mvp_scope,
      (
        SELECT b.deploy_url
        FROM build_artifacts b
        WHERE b.idea_id = i.id
        ORDER BY b.claimed_at DESC
        LIMIT 1
      ) AS deploy_url
    FROM receipts r
    JOIN ideas i ON i.id = r.idea_id
    WHERE i.status = ?
    ORDER BY r.created_at DESC
    LIMIT ?
    OFFSET ?`,
  )
    .bind("shipped", limit, offset)
    .all<ReceiptListRow>();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM receipts r
     JOIN ideas i ON i.id = r.idea_id
     WHERE i.status = ?`,
  )
    .bind("shipped")
    .first<{ total: number }>();

  return NextResponse.json({
    receipts: receipts.results ?? [],
    pagination: {
      page,
      limit,
      total: totalRow?.total ?? 0,
    },
  });
}
