"use client";

import { KofiModal } from "@/components/ui/kofi-modal";
import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/l-ui/dialog";
import { PROJECT_PRESENCES_SOURCE_URL } from "@/lib/constants";
import { type Platform } from "@/lib/data/platforms";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { DevelopmentCard } from "./development-card";
import { FeaturesCard } from "./features-card";
import { HeaderCard } from "./header-card";
import { InstallCard } from "./install-card";
import { StatsCard } from "./stats-card";
import { SupportedUrlsCard } from "./supported-urls-card";

const EXT_SOURCE = "DP_PROJECT_NAME_WEB";
let _msgId = 0;
function nextId(): string {
  _msgId += 1;
  return `w${_msgId}_${Date.now()}`;
}

function fireAndForget(url: string, opts?: RequestInit): void {
  fetch(url, opts).catch(() => { /* ignore */ });
}

type Props = {
  platform: Platform
};

export const PlatformDetailClient: FC<Props> = ({ platform }): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("MarketplaceDetail");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extDetected, setExtDetected] = useState(false);
  const [totalInstalls, setTotalInstalls] = useState(platform.totalInstalls);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);

  const needsUpdate = extDetected && isInstalled && installedVersion != null && installedVersion !== platform.version;

  useEffect(() => {
    const ping = setInterval(() => {
      window.postMessage({ source: EXT_SOURCE, type: "PING" }, "*");
    }, 300);
    setTimeout(() => clearInterval(ping), 3000);

    const handler = (event: MessageEvent) => {
      const msg = event.data ?? {};

      if (msg.type === "EXT_DETECTED") {
        clearInterval(ping);
        setExtDetected(true);
        window.postMessage(
          { source: EXT_SOURCE, type: "GET_INSTALLED", messageId: nextId() },
          "*",
        );
      }

      if (msg.source === EXT_SOURCE && msg.type === "INSTALLED_PRESENCES") {
        const installed = msg.payload?.[platform.slug];
        if (installed) {
          setIsInstalled(true);
          setInstalledVersion(installed.metadata?.version ?? null);
        }
      }

      if (msg.type === "EXT_INSTALL_RESULT" && msg.slug === platform.slug) {
        setIsInstalled(msg.success);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [platform.slug]);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!extDetected) {
      setIsInstalled(!isInstalled);
      return;
    }

    setLoading(true);
    try {
      const [metadata, bundle] = await Promise.all([
        fetch(`/api/p/${platform.slug}/metadata`).then((r) => r.json()),
        fetch(`/api/p/${platform.slug}/bundle`).then((r) => r.text()),
      ]);

      if (!isInstalled) {
        fireAndForget(`/api/p/${platform.slug}/installs`, { method: "POST" });
        setTotalInstalls((n) => n + 1);
      }

      window.postMessage(
        {
          source: EXT_SOURCE,
          type: needsUpdate ? "UPDATE_PRESENCE" : "INSTALL_PRESENCE",
          payload: {
            slug: platform.slug,
            metadata: { ...metadata, slug: platform.slug },
            bundle,
          },
        },
        "*",
      );

      setIsInstalled(true);
      setInstalledVersion(metadata.version ?? null);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [extDetected, isInstalled, platform.slug, needsUpdate]);

  const handleUninstall = useCallback((): void => {
    setShowUninstallConfirm(true);
  }, []);

  const confirmUninstall = useCallback((): void => {
    setIsInstalled(false);
    setInstalledVersion(null);
    window.postMessage(
      { source: EXT_SOURCE, type: "UNINSTALL_PRESENCE", payload: { slug: platform.slug } },
      "*",
    );
  }, [platform.slug]);

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-300 mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href={`/${locale}/marketplace`} className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{platform.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-6">
            <div className="space-y-6">
              <HeaderCard platform={platform} isInstalled={isInstalled} isExtDetected={extDetected} locale={locale} />
              <SupportedUrlsCard urls={platform.supportedUrls} />
              <FeaturesCard platform={platform} locale={locale} />
            </div>

            <div className="space-y-6">
              <DevelopmentCard
                author={platform.author}
                contributors={platform.contributors}
                sourceUrl={`${PROJECT_PRESENCES_SOURCE_URL}/${platform.name.charAt(0)}/${platform.name}/`}
              />
              <StatsCard platform={{ ...platform, totalInstalls }} locale={locale} slug={platform.slug} canRate={extDetected && isInstalled} />
              <InstallCard platform={platform} isInstalled={isInstalled} needsUpdate={needsUpdate} extDetected={extDetected} loading={loading} onInstall={handleInstall} onUninstall={handleUninstall} />

              <Link
                href={`/${locale}/marketplace`}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("back")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showUninstallConfirm} onOpenChange={setShowUninstallConfirm}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogMedia>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              </svg>
            </DialogMedia>
            <DialogTitle>{t("uninstallConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("uninstallConfirmDescription", { platform: platform.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogAction variant="destructive" onClick={confirmUninstall}>{t("uninstallConfirmAction")}</DialogAction>
            <DialogCancel>{t("uninstallConfirmCancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
