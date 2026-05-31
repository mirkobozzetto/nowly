"use client"

import { Card, CardDescription, CardTitle } from "@/components/l-ui/card"
import { getLocalizedDescription, getLocalizedLongDescription } from "@/lib/data/localized"
import type { Platform } from "@/lib/data/platforms"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"
import { InstallBadge } from "./install-badge"

const ASSET_URL = (slug: string, type: string) => `/api/p/${slug}/assets/${type}`

type Props = {
  platform: Platform
  isInstalled: boolean
  isExtDetected: boolean
  locale: string
}

export const HeaderCard: FC<Props> = ({ platform, isInstalled, isExtDetected, locale }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")
  const tCategories = useTranslations("MarketplacePage")
  const categoryLabel = tCategories(`categories.${platform.category}`)

  return (
    <Card>
      <div className="flex items-start gap-6">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: `${platform.iconColor}15` }}
        >
          <img
            src={ASSET_URL(platform.slug, "icon")}
            alt={platform.name}
            className="w-14 h-14 object-contain"
            onError={(e) => {
              const img = e.currentTarget
              img.src = ASSET_URL(platform.slug, "logo")
              const parent = img.parentElement
              if (parent) parent.style.backgroundColor = "transparent"
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-extrabold tracking-tight">{platform.name}</h1>
            <InstallBadge isInstalled={isInstalled} isExtDetected={isExtDetected} status={platform.status} />
          </div>
          <CardDescription className="mb-4">{getLocalizedDescription(platform, locale)}</CardDescription>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border">
            {categoryLabel}
          </span>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <CardTitle>{t("about")}</CardTitle>
        <CardDescription>{getLocalizedLongDescription(platform, locale)}</CardDescription>
      </div>
    </Card>
  )
}
