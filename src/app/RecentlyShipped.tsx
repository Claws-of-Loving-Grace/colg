"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Receipt = {
  id: string;
  idea_id: string;
  idea_title: string;
  summary: string;
  metric: string;
  next_steps: string | null;
  shipped_url: string | null;
  created_at: string;
};

const fallbackReceipts = Array.from({ length: 3 }, (_, index) => index);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentlyShipped() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/receipts?limit=3");
        if (!response.ok) {
          throw new Error("Failed to load receipts");
        }
        const data = (await response.json()) as { receipts?: Receipt[] };
        if (active) {
          setReceipts(data.receipts ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load receipts");
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
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return fallbackReceipts.map((item) => (
        <Card
          key={item}
          className="flex min-h-[220px] flex-col gap-4 border border-ink/60 bg-paper p-5"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-auto flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
        </Card>
      ));
    }

    if (error) {
      return (
        <Card className="border border-ink/60 bg-paper p-5 text-sm text-ink/70">
          {error}
        </Card>
      );
    }

    if (receipts.length === 0) {
      return (
        <Card className="border border-ink/60 bg-paper p-5 text-sm text-ink/70">
          No receipts yet. Check back after the first build ships.
        </Card>
      );
    }

    return receipts.map((receipt) => (
      <Card
        key={receipt.id}
        className="flex min-h-[220px] flex-col gap-4 border border-ink/60 bg-paper p-5"
      >
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
          Shipped {formatDate(receipt.created_at)}
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-serif text-xl font-semibold">{receipt.idea_title}</h4>
          <p className="text-sm text-ink/80">{receipt.summary}</p>
        </div>
        <div className="border-t border-ink/40 pt-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Metric: {receipt.metric}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.3em]">
          <Link href={`/ideas/${receipt.idea_id}`} className="border border-ink px-3 py-2">
            View idea
          </Link>
          {receipt.shipped_url && (
            <a
              href={receipt.shipped_url}
              target="_blank"
              rel="noreferrer"
              className="border border-ink px-3 py-2"
            >
              Live build
            </a>
          )}
        </div>
      </Card>
    ));
  }, [loading, error, receipts]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
          Recently shipped
        </p>
        <h3 className="font-serif text-3xl font-bold sm:text-4xl">
          New tools in the wild.
        </h3>
        <p className="max-w-2xl text-sm text-ink/70">
          Each receipt captures what shipped, the metric to watch, and where it lives.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{content}</div>
    </section>
  );
}
