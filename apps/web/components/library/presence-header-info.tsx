"use client";

import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import type { FC } from "react";

type Props = {
  presence: Presence
  locale: string
  categoryLabel: string
};

export const PresenceHeaderInfo: FC<Props> = ({ presence, locale, categoryLabel }) => (
  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
    <div
      className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden backdrop-blur-xl"
      style={{ backgroundColor: `${presence.iconColor}20` }}
    >
      <img
        src={ASSET_URL(presence.slug, "icon")}
        alt={presence.name}
        className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
        onError={(e) => {
          const img = e.currentTarget;
          img.src = ASSET_URL(presence.slug, "logo");
          const parent = img.parentElement;
          if (parent) parent.style.backgroundColor = "transparent";
        }}
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{presence.name}</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border w-fit">
          {categoryLabel}
        </span>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{getLocalizedDescription(presence, locale)}</p>
    </div>
  </div>
);