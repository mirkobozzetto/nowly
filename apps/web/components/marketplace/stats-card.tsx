"use client"

import { Card, CardTitle } from "@/components/l-ui/card"
import type { Platform } from "@/lib/data/platforms"
import { Star } from "lucide-react"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"
import { StatRow } from "./stat-row"

type Props = {
  platform: Platform
  locale: string
}

export const StatsCard: FC<Props> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Card size="sm">
      <CardTitle as="h3" className="text-foreground normal-case tracking-normal">{t("stats")}</CardTitle>
      <div className="space-y-4">
        {platform.status !== "soon" && (
          <>
            <StatRow label={t("activeUsers")} value={platform.activeUsers.toLocaleString()} />
            <StatRow label={t("totalInstalls")} value={platform.totalInstalls.toLocaleString()} />
            {platform.rating > 0 && (
              <StatRow label={t("rating")}>
                <span className="flex items-center gap-1 font-semibold">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {platform.rating}/5
                </span>
              </StatRow>
            )}
          </>
        )}
        <StatRow label={t("addedAt")} value={dateFormatter.format(new Date(platform.addedAt))} />
        <StatRow label={t("lastUpdated")} value={dateFormatter.format(new Date(platform.lastUpdated))} />
      </div>
    </Card>
  )
}
