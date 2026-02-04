"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "colg_voted";

type IdeaVotePanelProps = {
  ideaId: string;
  title: string;
  initialVotes: number;
};

export function IdeaVotePanel({ ideaId, title, initialVotes }: IdeaVotePanelProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [voting, setVoting] = useState(false);
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

  const handleVote = async () => {
    if (votedIds.has(ideaId) || voting) return;
    setVoting(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
      if (response.ok) {
        setVotes((current) => current + 1);
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
      setVoting(false);
    }
  };

  const voted = votedIds.has(ideaId);

  return (
    <div className="flex w-full flex-col gap-3 border-2 border-ink bg-muted p-4 lg:max-w-[260px]">
      <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
        Community vote
      </p>
      <button
        type="button"
        onClick={handleVote}
        disabled={voted || voting}
        className={cn(
          "flex w-full flex-col items-center justify-center border-2 border-ink bg-paper py-4 font-mono text-xs uppercase tracking-[0.2em]",
          voted ? "opacity-50" : "hover:bg-ink hover:text-paper",
        )}
        aria-label={`Vote for ${title}`}
      >
        <span className="text-2xl leading-none">▲</span>
        <span>{votes}</span>
      </button>
      <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
        {voted ? "Vote counted" : "Vote once per idea"}
      </p>
    </div>
  );
}
