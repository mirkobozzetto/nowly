"use client";

import { CATEGORIES } from "@/lib/data/categories";
import type { PresenceCategory } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "../ui/toggle";

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
          <Toggle key={category} onClick={() => onToggleCategory(category)}>
            {t(`categories.${category}`)}
          </Toggle>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-dim-foreground">{t("sortLabel")}</span>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue placeholder={t("sortLabel")} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="popular">{t("sortPopular")}</SelectItem>
            <SelectItem value="recent">{t("sortRecent")}</SelectItem>
            <SelectItem value="name-asc">{t("sortNameAsc")}</SelectItem>
            <SelectItem value="name-desc">{t("sortNameDesc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};