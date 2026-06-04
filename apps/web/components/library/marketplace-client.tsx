"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { MarketplaceGridSkeleton } from "@/components/library/marketplace-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresences } from "@/hooks/use-presences";
import { type PresenceCategory } from "@/lib/data/presences";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useMemo, useState } from "react";
import { MarketplaceFilters } from "./marketplace-filters";
import { MarketplaceGrid } from "./marketplace-grid";
import { MarketplaceSearch } from "./marketplace-search";

type SortOption = "name-asc" | "name-desc" | "popular" | "recent";

export const MarketplaceClient: FC = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("MarketplacePage");
  const { data: platforms, isLoading, isError, refetch } = usePresences();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PresenceCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const filteredPlatforms = useMemo(() => {
    if (!platforms) return [];

    let result = [...platforms];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        result.sort((a, b) => b.activeUsers - a.activeUsers);
        break;
      case "recent":
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, sortBy, platforms]);

  const toggleCategory = (category: PresenceCategory): void => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  return (
    <PageLayout>
      <div className="max-w-300 mx-auto px-6">
        <div className="text-center max-w-150 mx-auto mb-12">
          <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
            {t("badge")}
          </span>
          <h1 className="text-[2.5rem] mb-4 font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <MarketplaceSearch
          value={searchQuery}
          placeholder={t("searchPlaceholder")}
          onChange={setSearchQuery}
        />

        <MarketplaceFilters
          selectedCategories={selectedCategories}
          sortBy={sortBy}
          onToggleCategory={toggleCategory}
          onSortChange={setSortBy}
        />

        <div className="text-sm text-dim-foreground mb-6">
          {isLoading ? (
            <Skeleton className="h-4 w-24 inline-block" />
          ) : (
            t("results", { count: filteredPlatforms.length })
          )}
        </div>

        {isLoading && <MarketplaceGridSkeleton />}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load platforms</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <MarketplaceGrid
            platforms={filteredPlatforms}
            locale={locale}
            onReset={() => {
              setSearchQuery("");
              setSelectedCategories([]);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
};