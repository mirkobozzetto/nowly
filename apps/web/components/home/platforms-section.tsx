"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { usePresences } from "@/hooks/use-presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { PlatformComingSoonItem } from "./platform-coming-soon-item";
import { PlatformLinkItem } from "./platform-link-item";

const PlatformsSectionSkeleton: FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 p-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export const PlatformsSection: FC = (): ReactElement => {
  const t = useTranslations("PlatformsSection");
  const { data: platforms, isLoading } = usePresences();

  const available = platforms?.filter((p) => p.status === "available") ?? [];
  const soon = platforms?.filter((p) => p.status === "soon") ?? [];

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
          {isLoading && <PlatformsSectionSkeleton />}

          {!isLoading && available.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-dim-foreground uppercase tracking-[0.1em] mb-5 border-l-[3px] border-border pl-3">
                {t("availableHeading")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {available.map((platform) => (
                  <PlatformLinkItem key={platform.slug} platform={platform} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && soon.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-dim-foreground uppercase tracking-[0.1em] mb-5 border-l-[3px] border-border pl-3">
                {t("comingSoonHeading")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {soon.map((platform) => (
                  <PlatformComingSoonItem key={platform.slug} platform={platform} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};