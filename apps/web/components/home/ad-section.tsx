import { AdSenseSlot } from "@/components/ads/adsense-slot";
import { ADSENSE_ENABLED, LANDING_AD_SLOT } from "@/lib/constants";
import type { FC, ReactElement } from "react";

export const AdSection: FC = (): ReactElement | null => {
  if (!ADSENSE_ENABLED || process.env.NODE_ENV === "development") {
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
