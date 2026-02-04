"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { IdeaVotePanel } from "./IdeaVotePanel";

type IdeaTags = {
  scope?: string;
  type?: string;
  stack?: string;
  risk?: string;
};

type IdeaDetail = {
  id: string;
  title: string;
  problem: string;
  who_it_helps: string;
  mvp_scope: string;
  success_metric: string;
  constraints: string | null;
  links: string | null;
  status: string;
  tags: IdeaTags;
  score: number | null;
  score_components: Record<string, number>;
  triage_summary: string | null;
  clarifying_questions: string[];
  clarifying_responses: string[];
  dedupe_cluster_id: string | null;
  submitter_email: string | null;
  created_at: string;
  updated_at: string;
  vote_count: number;
};

type IdeaDetailResponse = {
  idea: IdeaDetail;
};

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

function parseLines(value: string | null) {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type IdeaDetailClientProps = {
  ideaId: string;
};

export function IdeaDetailClient({ ideaId }: IdeaDetailClientProps) {
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<string[]>([]);
  const [responseStatus, setResponseStatus] = useState<{
    type: "idle" | "saving" | "error" | "success";
    message?: string;
  }>({ type: "idle" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ideas/${ideaId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Idea not found" : "Failed to load");
        }
        const data = (await response.json()) as IdeaDetailResponse;
        if (active) {
          setIdea(data.idea);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [ideaId]);

  const constraints = useMemo(() => parseLines(idea?.constraints ?? null), [idea]);
  const links = useMemo(() => parseLines(idea?.links ?? null), [idea]);
  const tagEntries = useMemo(() => {
    if (!idea?.tags) return [];
    return Object.entries(idea.tags)
      .map(([key, value]) => ({ key, value }))
      .filter((entry) => entry.value && entry.value.trim().length > 0);
  }, [idea]);

  useEffect(() => {
    if (!idea) return;
    const questions = idea.clarifying_questions ?? [];
    if (questions.length === 0) {
      setResponseDrafts([]);
      setResponseStatus({ type: "idle" });
      return;
    }
    const drafts = questions.map(
      (_, index) => idea.clarifying_responses?.[index] ?? "",
    );
    setResponseDrafts(drafts);
    setResponseStatus({ type: "idle" });
  }, [idea]);

  if (loading) {
    return (
      <section className="border-2 border-ink bg-paper p-6 text-sm text-ink/70">
        Loading idea...
      </section>
    );
  }

  if (error || !idea) {
    return (
      <section className="border-2 border-ink bg-paper p-6 text-sm text-ink/70">
        {error ?? "Idea not found."}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
        <Link href="/leaderboard" className="hover:text-ink">
          Back to leaderboard
        </Link>
        <span>Idea detail</span>
      </div>

      <section className="border-2 border-ink bg-paper p-6">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={statusVariant(idea.status)}>
                {formatStatus(idea.status)}
              </Badge>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                Submitted by {idea.submitter_email ?? "Anonymous"} on{" "}
                {new Date(idea.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="font-serif text-4xl font-black leading-[0.95] sm:text-5xl">
              {idea.title}
            </h1>
            <p className="text-base text-ink/80 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-ink sm:text-lg">
              {idea.problem}
            </p>
          </div>
          <IdeaVotePanel
            ideaId={idea.id}
            title={idea.title}
            initialVotes={idea.vote_count}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
              Who it helps
            </p>
            <p className="text-sm text-ink/80">{idea.who_it_helps}</p>
          </div>
          <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
              MVP scope
            </p>
            <p className="text-sm text-ink/80">{idea.mvp_scope}</p>
          </div>
          <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
              Success metric
            </p>
            <p className="text-sm text-ink/80">{idea.success_metric}</p>
          </div>
        </div>

        {(constraints.length > 0 || links.length > 0) && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {constraints.length > 0 && (
              <div className="flex flex-col gap-3 border-2 border-ink/60 bg-paper p-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                  Constraints
                </p>
                <div className="flex flex-col gap-2 text-sm text-ink/80">
                  {constraints.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            )}
            {links.length > 0 && (
              <div className="flex flex-col gap-3 border-2 border-ink/60 bg-paper p-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                  Links
                </p>
                <div className="flex flex-col gap-2 text-sm text-ink/80">
                  {links.map((item) => {
                    const href =
                      item.startsWith("http://") || item.startsWith("https://")
                        ? item
                        : item.startsWith("www.")
                          ? `https://${item}`
                          : null;
                    if (!href) {
                      return <span key={item}>{item}</span>;
                    }
                    return (
                      <a
                        key={item}
                        href={href}
                        className="underline decoration-2 decoration-accent underline-offset-4"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 border-t-2 border-ink/60 pt-8">
          {(tagEntries.length > 0 ||
            idea.score !== null ||
            idea.triage_summary ||
            idea.clarifying_questions.length > 0) && (
            <div className="mb-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                  Triage Summary
                </p>
                {idea.score !== null && (
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Score {idea.score.toFixed(2)}
                  </span>
                )}
              </div>
              {tagEntries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagEntries.map((entry) => (
                    <Badge key={entry.key} variant="secondary">
                      {entry.key}: {entry.value}
                    </Badge>
                  ))}
                </div>
              )}
              {idea.triage_summary && (
                <p className="text-sm text-ink/80">{idea.triage_summary}</p>
              )}
              {idea.clarifying_questions.length > 0 && (
                <div className="flex flex-col gap-4 border-2 border-ink/60 bg-paper p-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                    Clarifying questions
                  </p>
                  <ol className="flex list-decimal flex-col gap-3 pl-4 text-sm text-ink/80">
                    {idea.clarifying_questions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ol>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setResponseStatus({ type: "saving" });
                      try {
                        const response = await fetch(
                          `/api/ideas/${idea.id}/clarify`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              responses: responseDrafts.map((item) => item.trim()),
                            }),
                          },
                        );
                        if (!response.ok) {
                          throw new Error(
                            response.status === 400
                              ? "Response rejected"
                              : "Failed to save responses",
                          );
                        }
                        const data = (await response.json()) as {
                          clarifying_responses: string[];
                        };
                        setIdea((prev) =>
                          prev
                            ? { ...prev, clarifying_responses: data.clarifying_responses }
                            : prev,
                        );
                        setResponseStatus({
                          type: "success",
                          message: "Responses saved.",
                        });
                      } catch (err) {
                        setResponseStatus({
                          type: "error",
                          message:
                            err instanceof Error
                              ? err.message
                              : "Failed to save responses",
                        });
                      }
                    }}
                  >
                    {idea.clarifying_questions.map((question, index) => (
                      <label key={question} className="flex flex-col gap-2">
                        <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                          Response {index + 1}
                        </span>
                        <Textarea
                          value={responseDrafts[index] ?? ""}
                          onChange={(event) => {
                            const next = [...responseDrafts];
                            next[index] = event.target.value;
                            setResponseDrafts(next);
                          }}
                          rows={2}
                          className="min-h-[80px]"
                        />
                      </label>
                    ))}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      <button
                        type="submit"
                        disabled={responseStatus.type === "saving"}
                        className="border-2 border-ink px-3 py-2 text-[11px] tracking-[0.3em] text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {responseStatus.type === "saving" ? "Saving" : "Send responses"}
                      </button>
                      {responseStatus.message && (
                        <span
                          className={
                            responseStatus.type === "error"
                              ? "text-accent"
                              : "text-ink/70"
                          }
                        >
                          {responseStatus.message}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
          <div className="hidden">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
              Build Status
            </p>
            <p className="text-sm text-ink/80">Pending build status.</p>
          </div>
          <div className="hidden">
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
              Receipt
            </p>
            <p className="text-sm text-ink/80">Pending public receipt.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
