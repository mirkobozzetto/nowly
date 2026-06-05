"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Download, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";

type Props = {
  isInstalled: boolean
  isExtDetected: boolean
  needsUpdate: boolean
  loading: boolean
  slug: string
  commentCount: number
  onInstall: () => void
  onUninstall: () => void
};

export const PresenceHeaderActions: FC<Props> = ({
  isInstalled,
  isExtDetected,
  needsUpdate,
  loading,
  slug,
  commentCount,
  onInstall,
  onUninstall,
}) => {
  const t = useTranslations("MarketplaceDetail");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {(!isInstalled || needsUpdate) && (
        <button
          onClick={onInstall}
          disabled={!isExtDetected || loading}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all",
            !isExtDetected || loading
              ? "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60"
              : isExtDetected && needsUpdate && !loading
                ? "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
                : "bg-foreground text-background hover:bg-[#e4e4e7]",
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
          <Trash2 className="w-4 h-4" />
          {t("uninstallAction")}
        </button>
      )}

      <Link
        href={`/library/${slug}/comments`}
        className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all border border-border bg-transparent text-muted-foreground hover:border-border-light hover:bg-card-2 hover:text-foreground ml-auto"
      >
        <Users className="w-4 h-4" />
        {t("community")} ({commentCount})
      </Link>
    </div>
  );
};
