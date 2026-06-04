"use client";

import { ASSET_URL } from "@/lib/assets";
import type { FC } from "react";
import { useState } from "react";

type Props = {
  slug: string
  categoryLabel?: string
};

export const PresenceCardThumbnail: FC<Props> = ({ slug, categoryLabel }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <div className="relative h-28 overflow-hidden">
      <img
        src={ASSET_URL(slug, "thumbnail")}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {categoryLabel && (
        <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest bg-card-2 text-muted-foreground">
          {categoryLabel}
        </span>
      )}

      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 25%)" }}
      />
    </div>
  );
};