"use client";

import { fetchPresence, presenceKey } from "@/hooks/use-presence";
import type { Presence } from "@/lib/data/presences";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useCallback } from "react";
import { PlatformCardBody } from "./platform-card-body";
import { PlatformCardStats } from "./platform-card-stats";
import { PlatformCardThumbnail } from "./platform-card-thumbnail";

type Props = {
  platform: Presence
  locale: string
};

export const PlatformCard: FC<Props> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("MarketplacePage");
  const queryClient = useQueryClient();
  const categoryLabel = t(`categories.${platform.category}`);

  const handleMouseEnter = useCallback(() => {
    if (platform.status === "soon") return;

    queryClient.prefetchQuery({
      queryKey: presenceKey(platform.slug),
      queryFn: () => fetchPresence(platform.slug),
      staleTime: 5 * 60 * 1000,
    });
  }, [platform.slug, platform.status, queryClient]);

  return (
    <Link
      href={`/library/${platform.slug}`}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group bg-card border rounded-lg transition-colors hover:bg-card-hover overflow-hidden",
        platform.status === "soon"
          ? "border-dashed border-border opacity-70 hover:opacity-100"
          : "border-border hover:border-muted-foreground",
      )}
    >
      <PlatformCardThumbnail slug={platform.slug} categoryLabel={categoryLabel} />

      <div className="p-5">
        <PlatformCardBody platform={platform} locale={locale} />

        <PlatformCardStats platform={platform} />
      </div>
    </Link>
  );
};