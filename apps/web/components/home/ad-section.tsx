"use client";

import { AdSenseSlot } from "@/components/ads/adsense-slot";
import { ADSENSE_CLIENT_ID, ADSENSE_ENABLED, LANDING_AD_SLOT } from "@/lib/constants";
import { useAdStatus } from "@/providers/ad-status-provider";
import type { FC, ReactElement } from "react";

export const AdSection: FC = (): ReactElement | null => {
  const { loading, hasAds, adFree } = useAdStatus();

  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT_ID || !LANDING_AD_SLOT || loading || !hasAds || adFree) {
    return null;
  }

  return (
    <section className="border-b border-border py-12">
      <div className="mx-auto max-w-300 px-6">
        <AdSenseSlot
          slot={LANDING_AD_SLOT}
          className="mx-auto max-w-240"
          minHeight="160px"
        />
      </div>
    </section>
  );
};
