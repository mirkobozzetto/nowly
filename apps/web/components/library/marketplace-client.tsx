"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { type Platform, type PlatformCategory } from "@/lib/data/platforms";
import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Metadata } from "@nowly/websites";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { MarketplaceFilters } from "./marketplace-filters";
import { MarketplaceGrid } from "./marketplace-grid";
import { MarketplaceSearch } from "./marketplace-search";

type SortOption = "name-asc" | "name-desc" | "popular" | "recent";

const MarketplaceClient: FC = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("MarketplacePage");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PlatformCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/presences`)
      .then((res) => res.json())
      .then((metadata: Metadata[]) => setPlatforms(metadata.map(metadataToPlatform)))
      .catch(() => {});
  }, []);

  const filteredPlatforms = useMemo(() => {
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

  const toggleCategory = (category: PlatformCategory): void => {
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

        <p className="text-sm text-dim-foreground mb-6">
          {t("results", { count: filteredPlatforms.length })}
        </p>

        <MarketplaceGrid
          platforms={filteredPlatforms}
          locale={locale}
          onReset={() => {
            setSearchQuery("");
            setSelectedCategories([]);
          }}
        />
      </div>
    </PageLayout>
  );
};

export { MarketplaceClient };
