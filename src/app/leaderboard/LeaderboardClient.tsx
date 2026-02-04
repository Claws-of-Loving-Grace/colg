"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "building", label: "Building" },
  { value: "shipped", label: "Shipped" },
];

const sortOptions = [
  { value: "votes", label: "Top votes" },
  { value: "newest", label: "Newest" },
  { value: "score", label: "Score" },
];

type IdeaRow = {
  id: string;
  title: string;
  who_it_helps: string;
  mvp_scope: string;
  status: string;
  score: number | null;
  created_at: string;
  vote_count: number;
  receipt_id: string | null;
  shipped_url: string | null;
  deploy_url: string | null;
};

type LeaderboardResponse = {
  ideas: IdeaRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

const STORAGE_KEY = "colg_voted";

function formatStatus(status: string) {
  if (status === "building") return "Building";
  if (status === "shipped") return "Shipped";
  return "Queued";
}

function statusVariant(status: string): "primary" | "secondary" | "accent" {
  if (status === "shipped") return "accent";
  if (status === "building") return "primary";
  return "secondary";
}

function toHref(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;
  return null;
}

export function LeaderboardClient() {
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("votes");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setVotedIds(new Set(parsed));
      } catch {
        setVotedIds(new Set());
      }
    }
  }, []);

  const persistVotes = useCallback((next: Set<string>) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status,
        sort,
        page: String(page),
        limit: String(limit),
      });
      const response = await fetch(`/api/ideas?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load leaderboard");
      }
      const data = (await response.json()) as LeaderboardResponse;
      setIdeas(data.ideas ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load leaderboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, sort, page, limit]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleVote = async (ideaId: string) => {
    if (votedIds.has(ideaId) || votingId) return;
    setVotingId(ideaId);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
      if (response.ok) {
        setIdeas((current) =>
          current.map((idea) =>
            idea.id === ideaId ? { ...idea, vote_count: idea.vote_count + 1 } : idea,
          ),
        );
      }
      if (response.ok || response.status === 409) {
        setVotedIds((current) => {
          const next = new Set(current);
          next.add(ideaId);
          persistVotes(next);
          return next;
        });
      }
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-2 border-ink bg-paper p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/70">
            Public leaderboard
          </p>
          <h1 className="font-serif text-4xl font-black">Ideas in Motion</h1>
          <p className="text-sm text-ink/70">
            Ranked by community signal. Vote once per idea.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex flex-col gap-1 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
            Status
            <select
              className="border-2 border-ink bg-paper px-3 py-2 font-mono text-xs uppercase tracking-[0.3em]"
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
            Sort
            <select
              className="border-2 border-ink bg-paper px-3 py-2 font-mono text-xs uppercase tracking-[0.3em]"
              value={sort}
              onChange={(event) => {
                setPage(1);
                setSort(event.target.value);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="border-2 border-ink bg-paper">
        <div className="hidden border-b-2 border-ink/60 px-4 py-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60 md:grid md:grid-cols-[110px_minmax(0,1fr)_180px]">
          <span>Votes</span>
          <span>Idea</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-ink/70">Loading leaderboard...</div>
        ) : error ? (
          <div className="p-6 text-sm text-ink/70">{error}</div>
        ) : ideas.length === 0 ? (
          <div className="p-6 text-sm text-ink/70">No ideas found yet.</div>
        ) : (
          ideas.map((idea, index) => (
            <div
              key={idea.id}
              className={cn(
                "border-t-2 border-ink/60 px-4 py-5",
                index === 0 ? "border-t-0" : "",
              )}
            >
              <div className="flex flex-col gap-4 md:grid md:grid-cols-[110px_minmax(0,1fr)_180px] md:items-start">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleVote(idea.id)}
                    disabled={votedIds.has(idea.id) || votingId === idea.id}
                    className={cn(
                      "flex h-12 w-12 flex-col items-center justify-center border-2 border-ink bg-paper font-mono text-xs uppercase tracking-[0.2em]",
                      votedIds.has(idea.id)
                        ? "opacity-50"
                        : "hover:bg-ink hover:text-paper",
                    )}
                    aria-label={`Vote for ${idea.title}`}
                  >
                    <span className="text-lg leading-none">▲</span>
                    <span>{idea.vote_count}</span>
                  </button>
                  <div className="flex flex-col gap-1 text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                    Rank {index + 1 + (page - 1) * limit}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="font-serif text-xl font-semibold text-ink hover:underline"
                  >
                    {idea.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{idea.mvp_scope}</Badge>
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      For {idea.who_it_helps}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={statusVariant(idea.status)}>
                    {formatStatus(idea.status)}
                  </Badge>
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    {new Date(idea.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {idea.status === "shipped" && (
                    <div className="flex flex-col gap-2 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      {(() => {
                        const deployHref = toHref(idea.deploy_url ?? idea.shipped_url);
                        return (
                          <>
                      {idea.receipt_id ? (
                        <Link
                          href={`/ideas/${idea.id}#receipt`}
                          className="underline decoration-2 decoration-accent underline-offset-4"
                        >
                          View receipt
                        </Link>
                      ) : (
                        <span>Receipt pending</span>
                      )}
                      {deployHref ? (
                        <a
                          href={deployHref}
                          className="underline decoration-2 decoration-accent underline-offset-4"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Deployed URL
                        </a>
                      ) : (
                        <span>
                          {idea.deploy_url ?? idea.shipped_url ?? "No deployed URL"}
                        </span>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="flex items-center justify-between border-2 border-ink bg-paper px-4 py-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border-2 border-ink bg-paper px-3 py-2"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <button
            type="button"
            className="border-2 border-ink bg-paper px-3 py-2"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
