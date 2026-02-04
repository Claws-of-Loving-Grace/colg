import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type ReceiptRow = {
  id: string;
  idea_id: string;
  idea_title: string;
  summary: string;
  metric: string;
  next_steps: string | null;
  shipped_url: string | null;
  created_at: string;
};

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(Math.max(Math.floor(parsed), 1), 12);
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));

  try {
    const query = `
      SELECT
        r.id,
        r.idea_id,
        i.title AS idea_title,
        r.summary,
        r.metric,
        r.next_steps,
        r.shipped_url,
        r.created_at
      FROM receipts r
      JOIN ideas i ON i.id = r.idea_id
      WHERE i.status = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `;

    const results = await env.DB.prepare(query)
      .bind("shipped", limit)
      .all<ReceiptRow>();

    return NextResponse.json({ receipts: results.results ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to load receipts" }, { status: 500 });
  }
}
