import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

const BASE =
  "w-full rounded-md border border-border bg-card-2 px-3 py-2 text-sm text-foreground placeholder:text-dim-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Drop the default styling so a fully custom `className` controls the look. */
  unstyled?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, unstyled, ...props }, ref) => (
    <textarea ref={ref} className={cn(unstyled ? undefined : BASE, className)} {...props} />
  ),
);