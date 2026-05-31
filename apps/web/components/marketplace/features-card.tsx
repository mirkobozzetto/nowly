"use client"

import { Card, CardTitle } from "@/components/l-ui/card"
import { getLocalizedFeatures } from "@/lib/data/localized"
import type { Platform } from "@/lib/data/platforms"
import { CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"

type Props = {
  platform: Platform
  locale: string
}

export const FeaturesCard: FC<Props> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")

  return (
    <Card>
      <CardTitle>{t("features")}</CardTitle>
      <ul className="space-y-3">
        {getLocalizedFeatures(platform, locale).map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  )
}
