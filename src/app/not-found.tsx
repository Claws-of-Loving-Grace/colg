import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="border-2 border-ink bg-paper p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink/70">
            Story not found
          </p>
          <h2 className="font-serif text-5xl font-black uppercase tracking-wide sm:text-6xl">
            STORY NOT FOUND
          </h2>
        </div>
        <p className="max-w-xl text-base text-ink/70">
          The archive does not contain this page. Return to the front page or submit a
          fresh idea to keep the loop moving.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            className={cn(
              buttonVariants({ variant: "primary" }),
              "sharp-corners",
              "w-full justify-center sm:w-auto",
            )}
            href="/"
          >
            Return home
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "sharp-corners",
              "w-full justify-center sm:w-auto",
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
