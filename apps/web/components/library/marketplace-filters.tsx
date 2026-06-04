"use client";

import { CATEGORIES } from "@/lib/data/categories";
import type { PresenceCategory } from "@/lib/data/presences";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type SortOption = "name-asc" | "name-desc" | "popular" | "recent";

type Props = {
  selectedCategories: PresenceCategory[]
  sortBy: SortOption
  onToggleCategory: (category: PresenceCategory) => void
  onSortChange: (sort: SortOption) => void
};

export const MarketplaceFilters: FC<Props> = ({
  selectedCategories,
  sortBy,
  onToggleCategory,
  onSortChange,
}) => {
  const t = useTranslations("MarketplacePage");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onToggleCategory(category)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              selectedCategories.includes(category)
                ? "bg-accent text-background"
                : "bg-card border border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground",
            )}
          >
            {t(`categories.${category}`)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-dim-foreground">{t("sortLabel")}</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="popular">{t("sortPopular")}</option>
          <option value="recent">{t("sortRecent")}</option>
          <option value="name-asc">{t("sortNameAsc")}</option>
          <option value="name-desc">{t("sortNameDesc")}</option>
        </select>
      </div>
    </div>
  );
};