"use client";

import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import type { FC } from "react";

type Props = {
  platform: Presence
  locale: string
};

export const PlatformCardBody: FC<Props> = ({ platform, locale }) => {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: `${platform.iconColor}15` }}
      >
        <img
          src={ASSET_URL(platform.slug, "icon")}
          alt={platform.name}
          className="w-8 h-8 object-contain"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            img.src = ASSET_URL(platform.slug, "logo");
            const parent = img.parentElement;
            if (parent) parent.style.backgroundColor = "transparent";
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate mb-1">{platform.name}</h3>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {getLocalizedDescription(platform, locale)}
        </p>
      </div>
    </div>
  );
};