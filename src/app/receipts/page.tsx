import { ReceiptsClient } from "./ReceiptsClient";

export const dynamic = "force-dynamic";

export default function ReceiptsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/60">
          Receipts
        </p>
        <h1 className="font-serif text-3xl font-black">Shipped Work</h1>
        <p className="text-sm text-ink/70">
          Public notes from the ideas that made it across the finish line.
        </p>
      </div>
      <ReceiptsClient />
    </div>
  );
}
