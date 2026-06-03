"use client";

import { type Platform } from "@/lib/data/platforms";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { PlatformCardBody } from "./platform-card-body";
import { PlatformCardStats } from "./platform-card-stats";
import { PlatformCardThumbnail } from "./platform-card-thumbnail";

type Props = {
  platform: Platform
  locale: string
};

export const PlatformCard: FC<Props> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("MarketplacePage");

  return (
    <Link
      href={`/library/${platform.slug}`}
      className={cn(
        "group bg-card border rounded-lg transition-colors hover:bg-card-hover overflow-hidden",
        platform.status === "soon"
          ? "border-dashed border-border opacity-70 hover:opacity-100"
          : "border-border hover:border-muted-foreground",
      )}
    >
      <PlatformCardThumbnail slug={platform.slug} />

      <div className="p-5">
        <PlatformCardBody platform={platform} locale={locale} />

        <PlatformCardStats platform={platform} />
      </div>
    </Link>
  );
};
