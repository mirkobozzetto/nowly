"use client"

import { Card, CardTitle } from "@/components/l-ui/card"
import type { Contributor } from "@/lib/data/platforms"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"
import { AuthorItem } from "./author-item"

type Props = {
  author: Contributor
  contributors: Contributor[]
}

export const DevelopmentCard: FC<Props> = ({ author, contributors }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")

  return (
    <Card size="sm">
      <CardTitle as="h3" className="text-foreground normal-case tracking-normal">{t("development")}</CardTitle>
      <AuthorItem
        contributor={author}
        label={contributors.length > 0 ? t("authorLabel") : undefined}
      />
      {contributors.length > 0 && contributors.map((contributor, index) => (
        <AuthorItem key={index} contributor={contributor} label={t("contributorLabel")} />
      ))}
    </Card>
  )
}
