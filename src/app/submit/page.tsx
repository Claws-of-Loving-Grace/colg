import { SubmitForm } from "./SubmitForm";

export default function SubmitPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="border-2 border-ink bg-paper p-5">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink/70">
            Submit an idea
          </p>
          <h1 className="font-serif text-4xl font-black leading-tight sm:text-5xl">
            Send us a focused, helpful micro-product.
          </h1>
          <p className="max-w-3xl text-sm text-ink/70">
            Compact ideas that can be built quickly and tested in the real
            world.
          </p>
        </div>
      </section>

      <section className="border-2 border-ink bg-paper p-6">
        <SubmitForm />
      </section>
    </div>
  );
}
