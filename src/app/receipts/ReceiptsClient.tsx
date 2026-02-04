"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type ReceiptRow = {
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
};

type ReceiptResponse = {
  receipts: ReceiptRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

function toHref(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;
  return null;
}

export function ReceiptsClient() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const response = await fetch(`/api/receipts?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load receipts");
      }
      const data = (await response.json()) as ReceiptResponse;
      setReceipts(data.receipts ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return (
    <div className="flex flex-col gap-6">
      <section className="border-2 border-ink bg-paper">
        <div className="hidden border-b-2 border-ink/60 px-4 py-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60 md:grid md:grid-cols-[120px_minmax(0,1fr)_220px]">
          <span>Shipped</span>
          <span>Receipt</span>
          <span>Links</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-ink/70">Loading receipts...</div>
        ) : error ? (
          <div className="p-6 text-sm text-ink/70">{error}</div>
        ) : receipts.length === 0 ? (
          <div className="p-6 text-sm text-ink/70">No receipts published yet.</div>
        ) : (
          receipts.map((receipt, index) => {
            const shippedHref = toHref(receipt.shipped_url);
            const deployHref = toHref(receipt.deploy_url);
            return (
              <div
                key={receipt.id}
                className={cn(
                  "border-t-2 border-ink/60 px-4 py-5",
                  index === 0 ? "border-t-0" : "",
                )}
              >
                <div className="flex flex-col gap-4 md:grid md:grid-cols-[120px_minmax(0,1fr)_220px]">
                  <div className="flex flex-col gap-2">
                    <Badge variant="accent">Shipped</Badge>
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      {new Date(receipt.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/receipts/${receipt.id}`}
                      className="font-serif text-xl font-semibold hover:underline"
                    >
                      {receipt.idea_title}
                    </Link>
                    <p className="text-sm text-ink/80">{receipt.summary}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary">{receipt.mvp_scope}</Badge>
                      <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                        For {receipt.who_it_helps}
                      </span>
                    </div>
                    <div className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      Metric: {receipt.metric}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    {deployHref ? (
                      <a
                        href={deployHref}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-2 decoration-accent underline-offset-4"
                      >
                        Deployed URL
                      </a>
                    ) : (
                      <span>{receipt.deploy_url ?? "No deploy URL"}</span>
                    )}
                    {shippedHref ? (
                      <a
                        href={shippedHref}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-2 decoration-accent underline-offset-4"
                      >
                        Shipped URL
                      </a>
                    ) : (
                      <span>{receipt.shipped_url ?? "No shipped URL"}</span>
                    )}
                    <Link
                      href={`/ideas/${receipt.idea_id}`}
                      className="underline decoration-2 decoration-accent underline-offset-4"
                    >
                      View idea
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
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
