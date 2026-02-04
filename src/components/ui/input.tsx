import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border-b-2 border-ink bg-transparent px-3 py-2 font-mono text-sm text-ink focus-visible:bg-[#F0F0F0] focus-visible:outline-none",
        "sharp-corners",
        className,
      )}
      {...props}
    />
  );
}
