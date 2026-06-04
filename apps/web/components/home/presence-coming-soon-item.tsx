"use client";

import { ASSET_URL } from "@/lib/assets";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type Props = {
  presence: Presence
};

export const PresenceComingSoonItem: FC<Props> = ({ presence }) => {
  const t = useTranslations("PlatformsSection");

  return (
    <div className="bg-transparent border border-border border-dashed rounded-lg p-5 text-center opacity-60 hover:opacity-90 hover:border-solid transition-all relative">
      <span className="absolute top-2 right-2 text-[9px] font-bold text-dim-foreground bg-background px-1.5 py-0.5 rounded border border-border">
        {t("comingSoonBadge")}
      </span>
      <div className="w-9 h-9 mx-auto mb-3 flex items-center justify-center">
        <img
          src={ASSET_URL(presence.slug, "icon")}
          alt={presence.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      <span className="font-semibold text-sm text-foreground">{presence.name}</span>
    </div>
  );
};