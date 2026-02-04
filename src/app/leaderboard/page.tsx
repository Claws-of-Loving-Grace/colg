import { LeaderboardClient } from "./LeaderboardClient";

export const metadata = {
  title: "Leaderboard",
  description: "Browse ranked ideas and vote for the ones that should ship next.",
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <LeaderboardClient />
    </div>
  );
}
