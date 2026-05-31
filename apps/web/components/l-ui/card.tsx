import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode
  className?: string
  size?: "default" | "sm"
};

type CardTitleProps = {
  children: ReactNode
  className?: string
  as?: "h2" | "h3"
};

export const Card: FC<CardProps> = ({ children, className, size = "default" }) => (
  <div
    className={cn(
      "bg-card border border-border rounded-xl",
      size === "sm" ? "p-6" : "p-8",
      className,
    )}
  >
    {children}
  </div>
);

export const CardTitle: FC<CardTitleProps> = ({ children, className, as = "h2" }) =>
  as === "h3" ? (
    <h3
      className={cn(
        "text-sm font-bold text-dim-foreground uppercase tracking-widest mb-4",
        className,
      )}
    >
      {children}
    </h3>
  ) : (
    <h2 className={cn("text-xl font-bold mb-4", className)}>{children}</h2>
  );

export const CardDescription: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <p className={cn("text-muted-foreground leading-relaxed", className)}>{children}</p>
);

export const CardContent: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn(className)}>{children}</div>;
