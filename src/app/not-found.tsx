import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="border-2 border-ink bg-paper p-8">
      <div className="flex flex-col gap-5">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
          Page not found
        </p>
        <h2 className="font-serif text-4xl font-bold sm:text-5xl">
          This space is empty.
        </h2>
        <p className="max-w-xl text-base text-ink/70">
          The page you requested is not available. Head back home or submit a
          fresh idea to keep the loop moving.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            className={cn(
              buttonVariants({ variant: "primary" }),
              "sharp-corners",
              "w-full justify-center sm:w-auto"
            )}
            href="/"
          >
            Return home
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "sharp-corners",
              "w-full justify-center sm:w-auto"
            )}
            href="/submit"
          >
            Submit an Idea
          </Link>
        </div>
      </div>
    </section>
  );
}
