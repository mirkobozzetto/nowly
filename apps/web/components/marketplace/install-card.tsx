"use client"

import { Card } from "@/components/l-ui/card"
import type { Platform } from "@/lib/data/platforms"
import { CheckCircle, Download } from "lucide-react"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"

type Props = {
  platform: Platform
  isInstalled: boolean
  extDetected: boolean
  onToggle: () => void
}

export const InstallCard: FC<Props> = ({ platform, isInstalled, extDetected, onToggle }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")

  return (
    <Card size="sm" className="bg-linear-to-b from-card to-surface">
      {platform.status === "available" || platform.status === "beta" ? (
        <>
          <h3 className="font-bold mb-2">
            {extDetected
              ? (isInstalled ? t("installed") : t("ready"))
              : "Extension non détectée"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {extDetected
              ? (isInstalled
                ? t("activeDescription", { platform: platform.name })
                : t("addDescription", { platform: platform.name }))
              : "Installe l'extension Presence Discord pour activer cette présence."}
          </p>
          <button
            onClick={onToggle}
            disabled={!extDetected}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              !extDetected
                ? "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60"
                : isInstalled
                  ? "bg-success/10 text-success border border-success/20 hover:bg-success/20"
                  : "bg-foreground text-background hover:bg-[#e4e4e7]"
            }`}
          >
            {isInstalled ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t("installedAction")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t("installAction")}
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <h3 className="font-bold mb-2">{t("comingSoon")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("comingSoonDescription", { platform: platform.name })}
          </p>
          <button
            disabled
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60"
          >
            {t("waiting")}
          </button>
        </>
      )}
    </Card>
  )
}
