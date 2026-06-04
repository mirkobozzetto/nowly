"use client";

import { PlatformCard } from "@/components/library/platform-card";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type Props = {
  platforms: Presence[]
  locale: string
  onReset: () => void
};

export const MarketplaceGrid: FC<Props> = ({ platforms, locale, onReset }) => {
  const t = useTranslations("MarketplacePage");

  if (platforms.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-2">{t("empty")}</p>
        <button onClick={onReset} className="text-accent hover:underline text-sm">
          {t("reset")}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map((platform) => (
        <PlatformCard key={platform.id} platform={platform} locale={locale} />
      ))}
    </div>
  );
};