"use client";

import { ASSET_URL } from "@/lib/assets";
import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Platform } from "@/lib/data/platforms";
import type { Metadata } from "@nowly/websites";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const PlatformsSection: FC = (): ReactElement => {
  const t = useTranslations("PlatformsSection");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/presences`)
      .then((res) => res.json())
      .then((metadata: Metadata[]) => setPlatforms(metadata.map(metadataToPlatform)))
      .catch(() => {});
  }, []);

  const available = platforms.filter((p) => p.status === "available");
  const soon = platforms.filter((p) => p.status === "soon");

  return (
    <section className="py-24 border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 relative z-[2]">
        <div className="text-center max-w-[600px] mx-auto mb-16">
          <span className="text-accent font-bold uppercase tracking-[0.1em] text-xs mb-4 block">
            {t("sectionLabel")}
          </span>
          <h2 className="text-[2.5rem] mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {available.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-dim-foreground uppercase tracking-[0.1em] mb-5 border-l-[3px] border-border pl-3">
                {t("availableHeading")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {available.map((platform) => (
                  <Link
                    key={platform.slug}
                     href={`/library/${platform.slug}`}
                    className="bg-card border border-border rounded-lg p-5 text-center transition-all hover:border-muted-foreground hover:bg-card-hover hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="w-9 h-9 mx-auto mb-3 flex items-center justify-center">
                      <img
                        src={ASSET_URL(platform.slug, "icon")}
                        alt={platform.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{platform.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {soon.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-dim-foreground uppercase tracking-[0.1em] mb-5 border-l-[3px] border-border pl-3">
                {t("comingSoonHeading")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {soon.map((platform) => (
                  <div
                    key={platform.slug}
                    className="bg-transparent border border-border border-dashed rounded-lg p-5 text-center opacity-60 hover:opacity-90 hover:border-solid transition-all relative"
                  >
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-dim-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                      {t("comingSoonBadge")}
                    </span>
                    <div className="w-9 h-9 mx-auto mb-3 flex items-center justify-center">
                      <img
                        src={ASSET_URL(platform.slug, "icon")}
                        alt={platform.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{platform.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
