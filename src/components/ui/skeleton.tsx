import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse border border-ink/20 bg-ink/10",
        "sharp-corners",
        className,
      )}
    />
  );
}
