export default function Home() {
  return (
    <section className="newsprint-texture border border-ink bg-paper p-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
          Foundation Slice
        </p>
        <h2 className="font-serif text-3xl font-bold">
          The press is warming up.
        </h2>
        <p className="font-body text-base text-ink/80">
          Design tokens, layout shell, and component library are now wired.
          Landing page content arrives in the next edition.
        </p>
      </div>
    </section>
  );
}
