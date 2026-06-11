"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresences } from "@/hooks/use-presences";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { PresenceItemMore, PresenceLinkItem } from "./presence-link-item";

const PresencesSectionSkeleton: FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const PresencesSection: FC = (): ReactElement => {
  const t = useTranslations("PlatformsSection");
  const locale = useLocale();
  const { data: presences, isLoading } = usePresences();

  const available = presences?.filter((p) => p.status === "available") ?? [];

  return (
    <section className="py-24 border-b border-border">
      <div className="max-w-300 mx-auto px-6 relative z-2">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-150">
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
              {t("sectionLabel")}
            </span>

            <h2 className="text-[2.5rem] mb-4">
              {t("title")}
            </h2>

            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <Button asChild variant="outline" size="md" className="w-fit">
            <Link href="/library">
              {t("libraryCta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-12">
          {isLoading && <PresencesSectionSkeleton />}

          {!isLoading && available.length > 0 && (
            <div className="space-y-5">
              <p className="text-sm text-dim-foreground">
                {t("servicesCount", { count: available.length })}
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {available.slice(0, 8).map((presence) => (
                  <PresenceLinkItem key={presence.slug} presence={presence} locale={locale} />
                ))}

                {available.length > 8 && <PresenceItemMore count={available.length - 8} label={t("moreToDiscover")} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
