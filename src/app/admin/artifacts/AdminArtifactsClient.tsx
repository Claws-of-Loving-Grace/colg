"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "colg_admin_key";

type PendingArtifact = {
  id: string;
  idea_id: string;
  agent_id: string;
  pr_url: string | null;
  deploy_url: string | null;
  status: string;
  claimed_at: string;
  idea_title: string;
};

function toHref(value: string | null) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("www.")) return `https://${value}`;
  return null;
}

export function AdminArtifactsClient() {
  const [apiKey, setApiKey] = useState("");
  const [artifacts, setArtifacts] = useState<PendingArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    if (stored) setApiKey(stored);
  }, []);

  const canFetch = useMemo(() => apiKey.trim().length > 0, [apiKey]);

  const fetchArtifacts = useCallback(async () => {
    if (!canFetch) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/artifacts", {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? "Unauthorized" : "Failed to load");
      }
      const data = (await response.json()) as { artifacts: PendingArtifact[] };
      setArtifacts(data.artifacts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiKey, canFetch]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const handleSaveKey = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, apiKey.trim());
    fetchArtifacts();
  };

  const handleUpdate = async (artifactId: string, status: "merged" | "rejected") => {
    if (!canFetch) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/artifacts/${artifactId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? "Unauthorized" : "Update failed");
      }
      setArtifacts((current) => current.filter((item) => item.id !== artifactId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-2 border-ink bg-paper p-5">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Admin Key
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter admin API key"
            type="password"
          />
          <Button variant="secondary" type="button" onClick={handleSaveKey}>
            Save key
          </Button>
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Provide the key set in `ADMIN_API_KEYS` to review artifacts.
        </p>
      </div>

      <section className="border-2 border-ink bg-paper">
        <div className="border-b-2 border-ink/60 px-4 py-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Pending PRs
        </div>
        {loading ? (
          <div className="p-6 text-sm text-ink/70">Loading pending artifacts...</div>
        ) : error ? (
          <div className="p-6 text-sm text-ink/70">{error}</div>
        ) : artifacts.length === 0 ? (
          <div className="p-6 text-sm text-ink/70">No artifacts awaiting review.</div>
        ) : (
          <div className="divide-y-2 divide-ink/60">
            {artifacts.map((artifact) => {
              const prHref = toHref(artifact.pr_url);
              const deployHref = toHref(artifact.deploy_url);
              return (
                <div key={artifact.id} className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="primary">Review</Badge>
                      <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                        Claimed {new Date(artifact.claimed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        className="font-serif text-2xl font-semibold hover:underline"
                        href={`/ideas/${artifact.idea_id}`}
                      >
                        {artifact.idea_title}
                      </Link>
                      <span className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                        Agent {artifact.agent_id}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-ink/80">
                      <div>
                        PR: {prHref ? (
                          <a
                            href={prHref}
                            target="_blank"
                            rel="noreferrer"
                            className="underline decoration-2 decoration-accent underline-offset-4"
                          >
                            {artifact.pr_url}
                          </a>
                        ) : (
                          <span>{artifact.pr_url ?? "Not provided"}</span>
                        )}
                      </div>
                      <div>
                        Deploy: {deployHref ? (
                          <a
                            href={deployHref}
                            target="_blank"
                            rel="noreferrer"
                            className="underline decoration-2 decoration-accent underline-offset-4"
                          >
                            {artifact.deploy_url}
                          </a>
                        ) : (
                          <span>{artifact.deploy_url ?? "Not provided"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
                      <Button
                        type="button"
                        onClick={() => handleUpdate(artifact.id, "merged")}
                      >
                        Approve PR
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleUpdate(artifact.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
