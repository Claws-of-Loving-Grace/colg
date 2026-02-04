import { AdminArtifactsClient } from "./AdminArtifactsClient";

export const dynamic = "force-dynamic";

export default function AdminArtifactsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Admin
        </p>
        <h1 className="font-serif text-3xl font-black">Artifact Review Desk</h1>
        <p className="text-sm text-ink/70">
          Review incoming PRs and approve builds for shipment.
        </p>
      </div>
      <AdminArtifactsClient />
    </div>
  );
}
