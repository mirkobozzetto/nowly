"use client";

import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import { categories, type Platform } from "@/lib/data/platforms";
import { cn } from "@/lib/utils";
import { Download, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useState } from "react";

type PlatformCardProps = {
  platform: Platform
  locale: string
};

export const PlatformCard: FC<PlatformCardProps> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("MarketplacePage");
  const [thumbnailError, setThumbnailError] = useState(false);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.src = ASSET_URL(platform.slug, "logo");
    const parent = img.parentElement;
    if (parent) parent.style.backgroundColor = "transparent";
  };

  const categoryLabel = categories.find((c) => c.value === platform.category)?.value ?? platform.category;

  return (
    <Link
       href={`/${locale}/library/${platform.slug}`}
      className={cn(
        "group bg-card border rounded-lg transition-colors hover:bg-card-hover overflow-hidden", {
          "border-dashed border-border opacity-70 hover:opacity-100": platform.status === "soon",
          "border-border hover:border-muted-foreground": platform.status !== "soon",
        }
      )}
    >
      {!thumbnailError && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={ASSET_URL(platform.slug, "thumbnail")}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setThumbnailError(true)}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 25%)" }}
          />
        </div>
      )}

      <div className="p-5">
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
              onError={handleImgError}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{platform.name}</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-dim-foreground whitespace-nowrap">
                {t(`categories.${categoryLabel}`)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {getLocalizedDescription(platform, locale)}
            </p>

            {platform.status === "available" && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {platform.totalInstalls.toLocaleString()}
                </span>

                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {platform.activeUsers.toLocaleString()}
                </span>

                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" fill={platform.iconColor} color={platform.iconColor} />
                  {platform.rating}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
