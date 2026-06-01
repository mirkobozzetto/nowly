"use client";

import { Card } from "@/components/l-ui/card";
import { cn } from "@/lib/utils";
import { PROJECT_NAME } from "@/lib/constants";
import type { Platform } from "@/lib/data/platforms";
import { CheckCircle, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Platform
  isInstalled: boolean
  needsUpdate: boolean
  extDetected: boolean
  loading?: boolean
  onInstall: () => void
  onUninstall: () => void
};

export const InstallCard: FC<Props> = ({ platform, isInstalled, needsUpdate, extDetected, loading, onInstall, onUninstall }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const noExtText = "Installe l'extension " + PROJECT_NAME + " pour activer cette présence.";

  return (
    <Card size="sm" className="bg-linear-to-b from-card to-surface">
      {platform.status === "available" || platform.status === "beta" ? (
        <>
          <h3 className="font-bold mb-2">
            {extDetected
              ? (needsUpdate ? t("updateAvailable") : isInstalled ? t("installed") : t("ready"))
              : "Extension non détectée"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {extDetected
              ? (needsUpdate
                ? t("updateDescription", { platform: platform.name })
                : isInstalled
                  ? t("activeDescription", { platform: platform.name })
                  : t("addDescription", { platform: platform.name }))
              : noExtText}
          </p>

          {(!isInstalled || needsUpdate) && (
            <button
              onClick={onInstall}
              disabled={!extDetected || loading}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all", {
                  "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60": !extDetected || loading,
                  "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20": extDetected && needsUpdate && !loading,
                  "bg-foreground text-background hover:bg-[#e4e4e7]": extDetected && !isInstalled && !loading
                }
              )}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : needsUpdate ? (
                <Download className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? t("installing") : needsUpdate ? t("updateAction") : t("installAction")}
            </button>
          )}

          {isInstalled && extDetected && !loading && (
            <button
              onClick={onUninstall}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 mt-2"
            >
              {t("uninstallAction")}
            </button>
          )}
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
  );
};
