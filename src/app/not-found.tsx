import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="border-2 border-ink bg-paper p-8">
      <div className="flex flex-col gap-5">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
          Story not found
        </p>
        <h2 className="font-serif text-4xl font-bold sm:text-5xl">
          This column is blank.
        </h2>
        <p className="max-w-xl text-base text-ink/70">
          The page you requested did not make it to press. Head back to the
          front page or submit a fresh idea for the next edition.
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
            Return to Front Page
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
