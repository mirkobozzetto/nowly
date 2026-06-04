import type { FC, ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "default" | "sm";
  variant?: "default" | "muted";
  bannerUrl?: string;
};


type CardTitleProps = {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
};

export const Card: FC<CardProps> = ({
  children,
  className,
  contentClassName,
  size = "default",
  variant = "default",
  bannerUrl,
}): ReactElement => (
  <div
    data-variant={variant}
    className={cn(
      "relative overflow-hidden rounded-2xl border shadow-sm transition-colors",
      "data-[variant=default]:border-border/80 data-[variant=default]:bg-card",
      "data-[variant=muted]:border-border/60 data-[variant=muted]:bg-muted/30",
      className,
    )}
  >
    {bannerUrl && (
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden">
        <img
          src={bannerUrl}
          alt=""
          aria-hidden="true"
          className="size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/75 to-card" />
      </div>
    )}

    <div
      className={cn(
        "relative z-10",
        size === "default" && (bannerUrl ? "px-6 pb-6 pt-28" : "p-6"),
        size === "sm" && (bannerUrl ? "px-5 pb-5 pt-24" : "p-5"),
        contentClassName,
      )}
    >
      {children}
    </div>
  </div>
);

export const CardTitle: FC<CardTitleProps> = ({
  children,
  className,
  as = "h2",
}): ReactElement => {
  const Component = as;

  return (
    <Component
      className={cn(
        as === "h3"
          ? "mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          : "mb-3 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </Component>
  );
};

export const CardDescription: FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }): ReactElement => (
  <p className={cn("text-sm leading-6 text-muted-foreground", className)}>
    {children}
  </p>
);

export const CardContent: FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }): ReactElement => (
  <div className={cn("space-y-4", className)}>{children}</div>
);