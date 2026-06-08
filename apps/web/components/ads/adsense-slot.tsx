"use client";

import { ADSENSE_CLIENT_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type Props = {
  slot: string
  className?: string
  minHeight?: string
  showLabel?: boolean
};

const isConfiguredSlot = (slot: string): boolean => {
  return slot.length > 0 && !slot.startsWith("REPLACE_WITH_");
};

export const AdSenseSlot: FC<Props> = ({
  slot,
  className,
  minHeight = "180px",
  showLabel = true,
}): ReactElement => {
  const t = useTranslations("Ads");
  const hasPushed = useRef(false);
  const isConfigured = useMemo(() => isConfiguredSlot(slot), [slot]);

  useEffect(() => {
    if (!isConfigured || hasPushed.current) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      hasPushed.current = true;
    } catch {
      hasPushed.current = false;
    }
  }, [isConfigured]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/70",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
      style={{ minHeight }}
    >
      {showLabel && (
        <div className="absolute left-3 top-3 z-1 rounded-full border border-border bg-background/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-dim-foreground backdrop-blur">
          {t("label")}
        </div>
      )}

      {isConfigured ? (
        <ins
          className="adsbygoogle block h-full w-full"
          style={{ display: "block", height: "100%", minHeight }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex h-full min-h-[inherit] items-center justify-center px-6 pt-7 text-center">
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("placeholder")}
          </p>
        </div>
      )}
    </div>
  );
};
