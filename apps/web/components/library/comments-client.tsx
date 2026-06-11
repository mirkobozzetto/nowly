"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardTitle } from "@/components/ui/card";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { CommentsCard } from "./comments-card";
import { RatingDistribution } from "./rating-distribution";

type Props = {
  presence: Presence;
};

export const CommentsClient: FC<Props> = ({ presence }): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("MarketplaceDetail");
  const tCategories = useTranslations("MarketplacePage");
  const categoryLabel = tCategories(`categories.${presence.category}`);

  return (
    <PageLayout>
      <div className="mx-auto max-w-300 px-6">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/library">
                {t("breadcrumbHome")}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbLink href={`/library/${presence.slug}`}>
                {presence.name}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{t("comments")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] mb-6">
          <Card bannerUrl={ASSET_URL(presence.slug, "thumbnail")}>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden backdrop-blur-xl"
                style={{ backgroundColor: `${presence.iconColor}20` }}
              >
                <img
                  src={ASSET_URL(presence.slug, "icon")}
                  alt={presence.name}
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.src = ASSET_URL(presence.slug, "logo");
                    const parent = img.parentElement;
                    if (parent) parent.style.backgroundColor = "transparent";
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{presence.name}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border w-fit">
                    {categoryLabel}
                  </span>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">{getLocalizedDescription(presence, locale)}</p>
              </div>
            </div>
          </Card>

          <Card size="sm">
            <CardTitle className="text-foreground normal-case tracking-normal">{t("commentsRatingDistribution")}</CardTitle>
            <RatingDistribution
              distribution={presence.ratingDistribution}
              totalCount={presence.ratingCount}
              iconColor={presence.iconColor}
            />
          </Card>
        </div>

        <CommentsCard
          slug={presence.slug}
          iconColor={presence.iconColor}
          locale={locale}
        />
      </div>
    </PageLayout>
  );
};
