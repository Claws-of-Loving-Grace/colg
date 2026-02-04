"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ReceiptDetail = {
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

type ReceiptDetailResponse = {
  receipt: ReceiptDetail;
};

function toHref(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;
  return null;
}

export function ReceiptDetailClient({ receiptId }: { receiptId: string }) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/receipts/${receiptId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Receipt not found" : "Failed");
        }
        const data = (await response.json()) as ReceiptDetailResponse;
        if (active) setReceipt(data.receipt);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [receiptId]);

  if (loading) {
    return (
      <section className="border-2 border-ink bg-paper p-6 text-sm text-ink/70">
        Loading receipt...
      </section>
    );
  }

  if (error || !receipt) {
    return (
      <section className="border-2 border-ink bg-paper p-6 text-sm text-ink/70">
        {error ?? "Receipt not found."}
      </section>
    );
  }

  const shippedHref = toHref(receipt.shipped_url);
  const deployHref = toHref(receipt.deploy_url);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
        <Link href="/receipts" className="hover:text-ink">
          Back to receipts
        </Link>
        <span>Receipt detail</span>
      </div>

      <section className="border-2 border-ink bg-paper p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
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
            <h1 className="font-serif text-4xl font-black leading-[0.95] sm:text-5xl">
              {receipt.idea_title}
            </h1>
            <p className="text-base text-ink/80 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-ink sm:text-lg">
              {receipt.problem}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                Who it helps
              </p>
              <p className="text-sm text-ink/80">{receipt.who_it_helps}</p>
            </div>
            <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                MVP scope
              </p>
              <p className="text-sm text-ink/80">{receipt.mvp_scope}</p>
            </div>
            <div className="flex flex-col gap-2 border-2 border-ink/60 bg-muted p-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                Metric
              </p>
              <p className="text-sm text-ink/80">{receipt.metric}</p>
            </div>
          </div>
          <div className="border-t-2 border-ink/60 pt-6">
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/60">
                Receipt
              </p>
              <p className="text-sm text-ink/80">{receipt.summary}</p>
              {receipt.next_steps && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                    Next steps
                  </span>
                  <span className="text-sm text-ink/80">{receipt.next_steps}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
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
        </div>
      </section>
    </div>
  );
}
