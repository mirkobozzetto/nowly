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
import { toast } from "sonner";
import { DevelopmentCard } from "./development-card";
import { FeaturesCard } from "./features-card";
import { HeaderCard } from "./header-card";
import { InstallCard } from "./install-card";
import { StatsCard } from "./stats-card";
import { SupportedUrlsCard } from "./supported-urls-card";

const EXT_SOURCE = "Nowly";
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
    const pingTimeout = setTimeout(() => clearInterval(ping), 5000);

    let gotInstalledResponse = false;

    const handler = (event: MessageEvent) => {
      const msg = event.data ?? {};

      if (msg.type === "EXT_DETECTED") {
        setExtDetected(true);
        if (!gotInstalledResponse) {
          window.postMessage(
            { source: EXT_SOURCE, type: "GET_INSTALLED", messageId: nextId() },
            "*",
          );
        }
      }

      if (msg.source === EXT_SOURCE && msg.type === "INSTALLED_PRESENCES") {
        const installed = msg.payload?.[platform.slug];
        if (installed) {
          setIsInstalled(true);
          setInstalledVersion(installed.metadata?.version ?? null);
          gotInstalledResponse = true;
          clearInterval(ping);
          clearTimeout(pingTimeout);
        } else if (msg.payload?.ok !== false) {
          gotInstalledResponse = true;
          clearInterval(ping);
          clearTimeout(pingTimeout);
        }
      }

      if (msg.source === EXT_SOURCE && msg.type === "INSTALL_PRESENCE_RESULT") {
        if (msg.payload?.ok) {
          setIsInstalled(true);
          toast.success(t("installSuccess", { platform: platform.name }));
        } else {
          setIsInstalled(false);
          setInstalledVersion(null);
          setLoading(false);
          toast.error(t("installError", { platform: platform.name }));
        }
      }

      if (msg.source === EXT_SOURCE && msg.type === "UNINSTALL_PRESENCE_RESULT") {
        if (msg.payload?.ok) {
          setIsInstalled(false);
          setInstalledVersion(null);
          toast.success(t("uninstallSuccess", { platform: platform.name }));
        }
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      clearInterval(ping);
      clearTimeout(pingTimeout);
    };
  }, [platform.slug]);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!extDetected) {
      toast.info(t("extNotDetected"));
      setIsInstalled(!isInstalled);
      return;
    }

    setLoading(true);
    try {
      const release = await fetch(`/api/p/${platform.slug}/release?v=${encodeURIComponent(platform.version ?? "dev")}`, {
          cache: "no-store",
        }).then((r) => r.json());

      if (!isInstalled) {
        fireAndForget(`/api/p/${platform.slug}/installs`, { method: "POST" });
        setTotalInstalls((n) => n + 1);
      }

      window.postMessage(
        {
          source: EXT_SOURCE,
          type: needsUpdate ? "UPDATE_PRESENCE" : "INSTALL_PRESENCE",
          messageId: nextId(),
          payload: {
            slug: platform.slug,
            release,
          },
        },
        "*",
      );

      setIsInstalled(true);
      setInstalledVersion(release.version ?? null);
      setLoading(false);
    } catch {
      toast.error(t("installError", { platform: platform.name }));
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
      { source: EXT_SOURCE, type: "UNINSTALL_PRESENCE", messageId: nextId(), payload: { slug: platform.slug } },
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
