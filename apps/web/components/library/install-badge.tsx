import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  isInstalled: boolean
  isExtDetected: boolean
  status: string
};

export const InstallBadge: FC<Props> = ({ isInstalled, isExtDetected, status }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");

  if (status === "soon") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-card-2 text-dim-foreground border border-border border-dashed">
        {t("comingSoon")}
      </span>
    );
  }

  if (status === "beta") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-amber-500/10 text-amber-500 border border-amber-500/20">
        {t("betaLabel")}
      </span>
    );
  }

  if (!isExtDetected) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-card-2 text-dim-foreground border border-border border-dashed">
        Extension requise
      </span>
    );
  }

  if (isInstalled) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-success/10 text-success border border-success/20">
        {t("installed")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-card-2 text-dim-foreground border border-border border-dashed">
      {t("ready")}
    </span>
  );
};
