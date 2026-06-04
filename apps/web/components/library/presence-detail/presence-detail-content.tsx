"use client";

import { PageLayout } from "@/components/layout/page-layout";
import type { Presence } from "@/lib/data/presences";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { DevelopmentCard } from "../development-card";
import { FeaturesCard } from "../features-card";
import { HeaderCard } from "../header-card";
import { InstallVersionsCard } from "../install-versions-card";
import { SettingsCard } from "../settings-card";
import { StatsCard } from "../stats-card";
import { SupportedUrlsCard } from "../supported-urls-card";

type Props = {
  presence: Presence
  isInstalled: boolean
  extDetected: boolean
  needsUpdate: boolean
  loading: boolean
  totalInstalls: number
  savedRating: number
  deviceId: string | null
  onInstall: () => void
  onUninstall: () => void
};

export const PresenceDetailContent: FC<Props> = ({
  presence,
  isInstalled,
  extDetected,
  needsUpdate,
  loading,
  totalInstalls,
  savedRating,
  deviceId,
  onInstall,
  onUninstall,
}): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("MarketplaceDetail");

  return (
    <PageLayout>
      <div className="mx-auto max-w-300 px-6">
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/library" className="transition-colors hover:text-foreground">
            {t("breadcrumbHome")}
          </Link>

          <ChevronRight className="h-4 w-4" />

          <span className="text-foreground">{presence.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            <HeaderCard
              presence={presence}
              isInstalled={isInstalled}
              isExtDetected={extDetected}
              locale={locale}
              needsUpdate={needsUpdate}
              loading={loading}
              onInstall={onInstall}
              onUninstall={onUninstall}
            />

            <SupportedUrlsCard urls={presence.supportedUrls} />
            <FeaturesCard platform={presence} locale={locale} />
          </div>

          <div className="space-y-4">
            <DevelopmentCard platform={presence} />
            <SettingsCard platform={presence} />

            <StatsCard
              platform={{ ...presence, totalInstalls }}
              locale={locale}
              slug={presence.slug}
              canRate={extDetected && isInstalled}
              savedRating={savedRating}
              deviceId={deviceId}
            />

            <InstallVersionsCard platform={presence} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};