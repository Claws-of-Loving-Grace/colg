import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type ReceiptDetailRow = {
  id: string;
  idea_id: string;
  summary: string;
  metric: string;
  next_steps: string | null;
  shipped_url: string | null;
  created_at: string;
  idea_title: string;
  who_it_helps: string;
  mvp_scope: string;
  problem: string;
  deploy_url: string | null;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { env } = getCloudflareContext();
  const params = await context.params;
  const receiptId = params?.id;

  if (!receiptId) {
    return NextResponse.json({ error: "Missing receipt id" }, { status: 400 });
  }

  const receipt = await env.DB.prepare(
    `SELECT
      r.id,
      r.idea_id,
      r.summary,
      r.metric,
      r.next_steps,
      r.shipped_url,
      r.created_at,
      i.title as idea_title,
      i.who_it_helps,
      i.mvp_scope,
      i.problem,
      (
        SELECT b.deploy_url
        FROM build_artifacts b
        WHERE b.idea_id = i.id
        ORDER BY b.claimed_at DESC
        LIMIT 1
      ) AS deploy_url
    FROM receipts r
    JOIN ideas i ON i.id = r.idea_id
    WHERE r.id = ?
    LIMIT 1`,
  )
    .bind(receiptId)
    .first<ReceiptDetailRow>();

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  return NextResponse.json({ receipt });
}
