import { cn } from "@/lib/cn";
import { forwardRef } from "react";
import type { LabelHTMLAttributes } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Drop the default styling so a fully custom `className` controls the look. */
  unstyled?: boolean;
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, unstyled, ...props }, ref) => (
    <label ref={ref} className={cn(unstyled ? undefined : "text-sm font-medium text-foreground", className)} {...props}>
      {children}
    </label>
  ),
);

Label.displayName = "Label";
