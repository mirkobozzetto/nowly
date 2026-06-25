"use client";

import { Card } from "@/components/ui/card";
import { ASSET_URL } from "@/lib/assets";
import { getLocalizedLongDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { PresenceHeaderAbout } from "./presence-header-about";
import { PresenceHeaderActions } from "./presence-header-actions";
import { PresenceHeaderInfo } from "./presence-header-info";

type Props = {
  presence: Presence
  isInstalled: boolean
  isExtDetected: boolean
  locale: string
  needsUpdate: boolean
  loading: boolean
  onInstall: () => void
  onUninstall: () => void
};

export const HeaderCard: FC<Props> = ({ presence, isInstalled, isExtDetected, locale, needsUpdate, loading, onInstall, onUninstall }): ReactElement => {
  const tCategories = useTranslations("marketplace-page");
  const categoryLabel = tCategories(`categories.${presence.category}`);

  return (
    <Card bannerUrl={ASSET_URL(presence.slug, "thumbnail")}>
      <PresenceHeaderInfo
        presence={presence}
        locale={locale}
        categoryLabel={categoryLabel}
      />

      <PresenceHeaderActions
        isInstalled={isInstalled}
        isExtDetected={isExtDetected}
        needsUpdate={needsUpdate}
        loading={loading}
        slug={presence.slug}
        commentCount={presence.ratingCount}
        onInstall={onInstall}
        onUninstall={onUninstall}
      />

      <PresenceHeaderAbout
        description={getLocalizedLongDescription(presence, locale)}
      />
    </Card>
  );
};