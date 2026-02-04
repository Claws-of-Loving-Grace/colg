import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { IdeaDetailClient } from "./IdeaDetailClient";

export const dynamic = "force-dynamic";
const PUBLIC_STATUSES = ["queued", "building", "shipped"] as const;

function truncate(value: string, max = 160) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { env } = getCloudflareContext();
  const { id } = await params;

  if (!id) {
    return { title: "Idea not found" };
  }

  const query = `
    SELECT title, problem
    FROM ideas
    WHERE id = ? AND status IN (${PUBLIC_STATUSES.map(() => "?").join(", ")})
    LIMIT 1
  `;

  try {
    const row = await env.DB.prepare(query)
      .bind(id, ...PUBLIC_STATUSES)
      .first<{ title: string; problem: string }>();

    if (!row) {
      return { title: "Idea not found" };
    }

    return {
      title: row.title,
      description: truncate(row.problem),
      openGraph: {
        title: row.title,
        description: truncate(row.problem),
      },
    };
  } catch {
    return { title: "Idea detail" };
  }
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IdeaDetailClient ideaId={id} />;
}
