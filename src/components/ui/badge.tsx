import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.25em]",
  {
    variants: {
      variant: {
        primary: "border-ink bg-ink text-paper",
        secondary: "border-ink bg-paper text-ink",
        accent: "border-accent bg-accent text-paper",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), "sharp-corners", className)}
      {...props}
    />
  );
}
