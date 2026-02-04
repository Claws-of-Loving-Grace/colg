"use client";

import { useEffect, useMemo, useState } from "react";

const formatter = new Intl.NumberFormat("en-US");

type Stats = {
  ideas: number;
  votes: number;
  shipped: number;
};

export function MarqueeTicker() {
  const [stats, setStats] = useState<Stats>({ ideas: 0, votes: 0, shipped: 0 });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch("/api/ideas?stats=1&limit=1");
        if (!response.ok) return;
        const data = (await response.json()) as { stats?: Stats };
        if (isMounted && data.stats) {
          setStats(data.stats);
        }
      } catch {
        // Silent fallback to zeroes.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const track = useMemo(() => {
    const ideas = formatter.format(stats.ideas);
    const votes = formatter.format(stats.votes);
    const shipped = formatter.format(stats.shipped);
    return `${ideas} ideas in motion · ${votes} community votes · ${shipped} shipped · `;
  }, [stats]);

  return (
    <section className="marquee bg-ink text-paper">
      <div className="marquee__track">
        <span>
          {track}
          {track}
          {track}
        </span>
      </div>
    </section>
  );
}
