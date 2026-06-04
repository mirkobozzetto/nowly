"use client";

import { fetchPresence, presenceKey } from "@/hooks/use-presence";
import type { Presence } from "@/lib/data/presences";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useCallback } from "react";
import { PresenceCardBody } from "./presence-card-body";
import { PresenceCardStats } from "./presence-card-stats";
import { PresenceCardThumbnail } from "./presence-card-thumbnail";

type Props = {
  presence: Presence
  locale: string
};

export const PresenceCard: FC<Props> = ({ presence, locale }): ReactElement => {
  const t = useTranslations("MarketplacePage");
  const queryClient = useQueryClient();
  const categoryLabel = t(`categories.${presence.category}`);

  const handleMouseEnter = useCallback(() => {
    if (presence.status === "soon") return;

    queryClient.prefetchQuery({
      queryKey: presenceKey(presence.slug),
      queryFn: () => fetchPresence(presence.slug),
      staleTime: 5 * 60 * 1000,
    });
  }, [presence.slug, presence.status, queryClient]);

  return (
    <Link
      href={`/library/${presence.slug}`}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "group bg-card border rounded-lg transition-colors hover:bg-card-hover overflow-hidden",
        presence.status === "soon"
          ? "border-dashed border-border opacity-70 hover:opacity-100"
          : "border-border hover:border-muted-foreground",
      )}
    >
      <PresenceCardThumbnail slug={presence.slug} categoryLabel={categoryLabel} />

      <div className="p-5">
        <PresenceCardBody presence={presence} locale={locale} />

        <PresenceCardStats presence={presence} />
      </div>
    </Link>
  );
};