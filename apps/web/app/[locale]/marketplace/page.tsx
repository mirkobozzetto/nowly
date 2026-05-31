"use client"

import { Search, Star, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import type { FC, ReactElement } from "react"
import { useMemo, useState, useEffect } from "react"

const ASSET_URL = (slug: string, type: string) => `/api/p/${slug}/assets/${type}`
import { categories, type Platform, type PlatformCategory } from "@/lib/data/platforms"
import { metadataToPlatform } from "@/lib/data/presence-adapter"
import { getLocalizedDescription } from "@/lib/data/localized"
import type { Metadata } from "@presence/websites"

type SortOption = "name-asc" | "name-desc" | "popular" | "recent"

const MarketplacePage: FC = (): ReactElement => {
  const locale = useLocale()
  const t = useTranslations("MarketplacePage")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<PlatformCategory[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("popular")
  const [platforms, setPlatforms] = useState<Platform[]>([])

  useEffect(() => {
    fetch("/api/p")
      .then((res) => res.json())
      .then((metadata: Metadata[]) => setPlatforms(metadata.map(metadataToPlatform)))
      .catch(() => {})
  }, [])

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
  }, [searchQuery, selectedCategories, sortBy, platforms])

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim-foreground" />
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

type PlatformCardProps = {
  platform: Platform
  locale: string
}

const PlatformCard: FC<PlatformCardProps> = ({ platform, locale }): ReactElement => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    img.src = ASSET_URL(platform.slug, "logo")
    const parent = img.parentElement
    if (parent) parent.style.backgroundColor = "transparent"
  }

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
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: `${platform.iconColor}15` }}
        >
          <img
            src={ASSET_URL(platform.slug, "icon")}
            alt={platform.name}
            className="w-8 h-8 object-contain"
            loading="lazy"
            onError={handleImgError}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{platform.name}</h3>
            {/* <StatusBadge status={platform.status} /> */}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {getLocalizedDescription(platform, locale)}
          </p>

          {platform.status === "available" && (
            <div className="flex items-center gap-4 text-xs text-dim-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {platform.activeUsers.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
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
