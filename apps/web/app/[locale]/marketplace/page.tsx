"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import type { FC, ReactElement } from "react"
import { useMemo, useState } from "react"

import { PlatformIcon, StatusBadge } from "@/components/marketplace/platform-utils"
import { categories, platforms, type Platform, type PlatformCategory } from "@/lib/data/platforms"

type SortOption = "name-asc" | "name-desc" | "popular" | "recent"

type PlatformCardProps = {
  platform: Platform
}

const MarketplacePage: FC = (): ReactElement => {
  const locale = useLocale()
  const t = useTranslations("MarketplacePage")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<PlatformCategory[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("popular")

  const filteredPlatforms = useMemo(() => {
    let result = [...platforms]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      )
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category))
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "popular":
        result.sort((a, b) => b.activeUsers - a.activeUsers)
        break
      case "recent":
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        break
    }

    return result
  }, [searchQuery, selectedCategories, sortBy])

  const toggleCategory = (category: PlatformCategory): void => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  return (
    <main className="min-h-screen pt-24 pb-16">
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

        <div className="relative mb-6">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-dim-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategories.includes(category.value)
                    ? "bg-accent text-background"
                    : "bg-card border border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`categories.${category.value}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-dim-foreground">{t("sortLabel")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="popular">{t("sortPopular")}</option>
              <option value="recent">{t("sortRecent")}</option>
              <option value="name-asc">{t("sortNameAsc")}</option>
              <option value="name-desc">{t("sortNameDesc")}</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-dim-foreground mb-6">
          {t("results", {count: filteredPlatforms.length})}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} locale={locale} />
          ))}
        </div>

        {filteredPlatforms.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-2">{t("empty")}</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategories([])
              }}
              className="text-accent hover:underline text-sm"
            >
              {t("reset")}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

type PlatformCardPropsWithLocale = PlatformCardProps & {
  locale: string
}

const PlatformCard: FC<PlatformCardPropsWithLocale> = ({ platform, locale }): ReactElement => {
  return (
    <Link
      href={`/${locale}/marketplace/${platform.slug}`}
      className={`group bg-card border rounded-lg p-5 transition-all hover:bg-card-hover hover:-translate-y-0.5 ${
        platform.status === "soon"
          ? "border-dashed border-border opacity-70 hover:opacity-100"
          : "border-border hover:border-muted-foreground"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${platform.iconColor}15` }}
        >
          <PlatformIcon icon={platform.icon} color={platform.iconColor} className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{platform.name}</h3>
            <StatusBadge status={platform.status} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {platform.description}
          </p>

          {platform.status === "available" && (
            <div className="flex items-center gap-4 text-xs text-dim-foreground">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {platform.activeUsers.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 fill-amber-500" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {platform.rating}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default MarketplacePage
