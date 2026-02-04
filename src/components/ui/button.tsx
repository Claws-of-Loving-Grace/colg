import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 border px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-all duration-200 ease-out min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-ink text-paper hover:border-ink hover:bg-paper hover:text-ink",
        secondary: "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        ghost: "border-transparent bg-transparent text-ink hover:bg-muted",
        link: "border-transparent bg-transparent text-ink underline-offset-4 decoration-2 decoration-accent hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }), "sharp-corners", className)}
      {...props}
    />
  );
}
