"use client";

import type { Platform } from "@/lib/data/platforms";
import type { FC, ReactElement } from "react";
import { PlatformDetailContent } from "./platform-detail-content";
import { PlatformDetailDialogs } from "./platform-detail-dialogs";
import { usePlatformPresence } from "./use-platform-presence";

type Props = {
  platform: Platform
};

export const PlatformDetailClient: FC<Props> = ({ platform }): ReactElement => {
  const presence = usePlatformPresence(platform);

  return (
    <>
      <PlatformDetailContent
        platform={platform}
        isInstalled={presence.isInstalled}
        extDetected={presence.extDetected}
        needsUpdate={presence.needsUpdate}
        loading={presence.loading}
        totalInstalls={presence.totalInstalls}
        savedRating={presence.savedRating}
        deviceId={presence.deviceId}
        onInstall={presence.handleInstall}
        onUninstall={presence.handleUninstallRequest}
      />

      <PlatformDetailDialogs
        platform={platform}
        showUninstallConfirm={presence.showUninstallConfirm}
        setShowUninstallConfirm={presence.setShowUninstallConfirm}
        showDowngradeConfirm={presence.showDowngradeConfirm}
        setShowDowngradeConfirm={presence.setShowDowngradeConfirm}
        onConfirmUninstall={presence.confirmUninstall}
        onConfirmDowngrade={presence.confirmDowngrade}
      />
    </>
  );
};
