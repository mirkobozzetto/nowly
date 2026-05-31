"use client"

import { KofiModal } from "@/components/ui/kofi-modal"
import { PROJECT_PRESENCES_SOURCE_URL } from "@/lib/constants"
import { type Platform } from "@/lib/data/platforms"
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import type { FC, ReactElement } from "react"
import { useCallback, useEffect, useState } from "react"
import { DevelopmentCard } from "./development-card"
import { FeaturesCard } from "./features-card"
import { HeaderCard } from "./header-card"
import { InstallCard } from "./install-card"
import { StatsCard } from "./stats-card"
import { SupportedUrlsCard } from "./supported-urls-card"

type Props = {
  platform: Platform
}

export const PlatformDetailClient: FC<Props> = ({ platform }): ReactElement => {
  const locale = useLocale()
  const t = useTranslations("MarketplaceDetail")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [extDetected, setExtDetected] = useState(false)

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "EXT_DETECTED") {
        setExtDetected(true)
        window.postMessage({ type: "EXT_GET_INSTALLED" }, window.location.origin)
      }
      if (event.data?.type === "EXT_INSTALLED_LIST") {
        setIsInstalled(!!event.data.presences[platform.slug])
      }
      if (event.data?.type === "EXT_INSTALL_RESULT" && event.data.slug === platform.slug) {
        setIsInstalled(event.data.success)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [platform.slug])

  const toggleInstall = useCallback((): void => {
    if (extDetected) {
      window.postMessage(
        { type: "EXT_INSTALL_PRESENCE", slug: platform.slug, enable: !isInstalled },
        window.location.origin
      )
    } else {
      setIsInstalled(!isInstalled)
    }
  }, [extDetected, isInstalled, platform.slug])

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-300 mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-dim-foreground mb-8">
            <Link href={`/${locale}/marketplace`} className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{platform.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-6">
            <div className="space-y-6">
              <HeaderCard platform={platform} isInstalled={isInstalled} isExtDetected={extDetected} locale={locale} />
              <SupportedUrlsCard urls={platform.supportedUrls} />
              <FeaturesCard platform={platform} locale={locale} />
            </div>

            <div className="space-y-6">
              <DevelopmentCard author={platform.author} contributors={platform.contributors} />
              <StatsCard platform={platform} locale={locale} />
              <InstallCard platform={platform} isInstalled={isInstalled} extDetected={extDetected} onToggle={toggleInstall} />

              <a
                href={`${PROJECT_PRESENCES_SOURCE_URL}/${platform.name.charAt(0)}/${platform.name}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t("source")}
              </a>

              <Link
                href={`/${locale}/marketplace`}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("back")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}