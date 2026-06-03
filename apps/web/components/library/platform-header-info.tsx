"use client";

import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Platform } from "@/lib/data/platforms";
import type { FC } from "react";

type Props = {
  platform: Platform
  locale: string
  categoryLabel: string
};

export const PlatformHeaderInfo: FC<Props> = ({ platform, locale, categoryLabel }) => (
  <div className="flex items-start gap-6">
    <div
      className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
      style={{ backgroundColor: `${platform.iconColor}15` }}
    >
      <img
        src={ASSET_URL(platform.slug, "icon")}
        alt={platform.name}
        className="w-14 h-14 object-contain"
        onError={(e) => {
          const img = e.currentTarget;
          img.src = ASSET_URL(platform.slug, "logo");
          const parent = img.parentElement;
          if (parent) parent.style.backgroundColor = "transparent";
        }}
      />
    </div>

    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <h1 className="text-3xl font-extrabold tracking-tight">{platform.name}</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border">
          {categoryLabel}
        </span>
      </div>

      <p className="mb-4 text-sm leading-6 text-muted-foreground">{getLocalizedDescription(platform, locale)}</p>
    </div>
  </div>
);
