"use client";

import { Card, CardDescription, CardTitle } from "@/components/l-ui/card";
import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription, getLocalizedLongDescription } from "@/lib/data/localized";
import type { Platform } from "@/lib/data/platforms";
import { cn } from "@/lib/utils";
import { Download, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  platform: Platform
  isInstalled: boolean
  isExtDetected: boolean
  locale: string
  needsUpdate: boolean
  loading: boolean
  onInstall: () => void
  onUninstall: () => void
};

export const HeaderCard: FC<Props> = ({ platform, isInstalled, isExtDetected, locale, needsUpdate, loading, onInstall, onUninstall }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const tCategories = useTranslations("MarketplacePage");
  const categoryLabel = tCategories(`categories.${platform.category}`);

  return (
    <Card bannerUrl={ASSET_URL(platform.slug, "thumbnail")}>
      <div className="flex items-start gap-6">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: `${platform.iconColor}15` }}
        >
          <img
            src={ASSET_URL(platform.slug, "icon")}
            alt={platform.name}
            className="w-14 h-14 object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              img.src = ASSET_URL(platform.slug, "logo");
              const parent = img.parentElement;
              if (parent) parent.style.backgroundColor = "transparent";
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-extrabold tracking-tight">{platform.name}</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border">
              {categoryLabel}
            </span>
          </div>

          <CardDescription className="mb-4">{getLocalizedDescription(platform, locale)}</CardDescription>

          <div className="flex items-center gap-2 flex-wrap">
            {(!isInstalled || needsUpdate) && (
              <button
                onClick={onInstall}
                disabled={!isExtDetected || loading}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all", {
                    "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60": !isExtDetected || loading,
                    "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20": isExtDetected && needsUpdate && !loading,
                    "bg-foreground text-background hover:bg-[#e4e4e7]": isExtDetected && !isInstalled && !loading,
                  }
                )}
              >
                {loading ? <Spinner /> : <Download className="w-4 h-4" />}
                {loading ? t("installing") : needsUpdate ? t("updateAction") : t("installAction")}
              </button>
            )}

            {isInstalled && isExtDetected && !loading && (
              <button
                onClick={onUninstall}
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
              >
                {loading ? <Spinner /> : <Trash2 className="w-4 h-4" />}
                {t("uninstallAction")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <CardTitle>{t("about")}</CardTitle>
        <CardDescription>{getLocalizedLongDescription(platform, locale)}</CardDescription>
      </div>
    </Card>
  );
};
