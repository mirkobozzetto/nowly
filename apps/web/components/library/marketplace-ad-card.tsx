"use client";

import { AdSenseSlot } from "@/components/ads/adsense-slot";
import { LIBRARY_AD_SLOT } from "@/lib/constants";
import { Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

export const MarketplaceAdCard: FC = (): ReactElement => {
  const t = useTranslations("Ads");

  return (
    <div className="h-full max-h-68 bg-card border border-border rounded-lg overflow-hidden">
      <div className="relative h-28 max-h-28 overflow-hidden bg-card-2">
        <AdSenseSlot
          slot={LIBRARY_AD_SLOT}
          className="h-28 max-h-28 rounded-none border-0 bg-transparent"
          minHeight="0px"
          showLabel={false}
        />
      </div>

      <div className="p-5 h-40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-accent/10 text-accent">
            <Megaphone className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-1">{t("cardTitle")}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {t("cardDescription")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{t("label")}</span>
        </div>
      </div>
    </div>
  );
};