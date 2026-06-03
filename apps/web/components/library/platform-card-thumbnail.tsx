"use client";

import { ASSET_URL } from "@/lib/assets";
import type { FC } from "react";
import { useState } from "react";

type Props = {
  slug: string
};

export const PlatformCardThumbnail: FC<Props> = ({ slug }) => {
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
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 25%)" }}
      />
    </div>
  );
};
