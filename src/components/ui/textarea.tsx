import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full border-b-2 border-ink bg-transparent px-3 py-2 font-mono text-sm text-ink focus-visible:bg-[#F0F0F0] focus-visible:outline-none",
        "sharp-corners",
        className,
      )}
      {...props}
    />
  );
}
