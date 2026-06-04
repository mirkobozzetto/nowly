"use client";

import { Card } from "@/components/l-ui/card";
import { ASSET_URL } from "@/lib/assets";
import { getLocalizedLongDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { PlatformHeaderAbout } from "./platform-header-about";
import { PlatformHeaderActions } from "./platform-header-actions";
import { PlatformHeaderInfo } from "./platform-header-info";

type Props = {
  platform: Presence
  isInstalled: boolean
  isExtDetected: boolean
  locale: string
  needsUpdate: boolean
  loading: boolean
  onInstall: () => void
  onUninstall: () => void
};

export const HeaderCard: FC<Props> = ({ platform, isInstalled, isExtDetected, locale, needsUpdate, loading, onInstall, onUninstall }): ReactElement => {
  const tCategories = useTranslations("MarketplacePage");
  const categoryLabel = tCategories(`categories.${platform.category}`);

  return (
    <Card bannerUrl={ASSET_URL(platform.slug, "thumbnail")}>
      <PlatformHeaderInfo
        platform={platform}
        locale={locale}
        categoryLabel={categoryLabel}
      />

      <PlatformHeaderActions
        isInstalled={isInstalled}
        isExtDetected={isExtDetected}
        needsUpdate={needsUpdate}
        loading={loading}
        onInstall={onInstall}
        onUninstall={onUninstall}
      />

      <PlatformHeaderAbout
        description={getLocalizedLongDescription(platform, locale)}
      />
    </Card>
  );
};