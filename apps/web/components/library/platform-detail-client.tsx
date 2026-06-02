"use client";

import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/l-ui/dialog";
import { KofiModal } from "@/components/ui/kofi-modal";
import { API_BASE_URL } from "@/lib/constants";
import { type Platform } from "@/lib/data/platforms";
import { ChevronRight, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DevelopmentCard } from "./development-card";
import { FeaturesCard } from "./features-card";
import { HeaderCard } from "./header-card";
import { InstallVersionsCard } from "./install-versions-card";
import { SettingsCard } from "./settings-card";
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

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
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
  const [savedRating, setSavedRating] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [installingVersion, setInstallingVersion] = useState<string | null>(null);
  const [pendingVersion, setPendingVersion] = useState<string | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

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
        window.postMessage(
          { source: EXT_SOURCE, type: "GET_USER_RATINGS", messageId: nextId() },
          "*",
        );
      }

      if (msg.source === EXT_SOURCE && msg.type === "USER_RATINGS") {
        const payload = msg.payload as { ratings?: Record<string, number>; deviceId?: string } | undefined;
        if (payload?.ratings?.[platform.slug]) {
          setSavedRating(payload.ratings[platform.slug]);
        }
        if (payload?.deviceId) {
          setDeviceId(payload.deviceId);
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
      const release = await fetch(`${API_BASE_URL}/presences/${platform.slug}?v=${encodeURIComponent(platform.version ?? "dev")}`, {
          cache: "no-store",
        }).then((r) => r.json());

      if (!isInstalled) {
        fireAndForget(`${API_BASE_URL}/presences/${platform.slug}/installs`, { method: "POST" });
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

  const installVersion = useCallback(async (version: string): Promise<void> => {
    setInstallingVersion(version);
    try {
      const release = await fetch(`${API_BASE_URL}/presences/${platform.slug}/versions/${encodeURIComponent(version)}`, {
          cache: "no-store",
        }).then((r) => {
          if (!r.ok) throw new Error("version not found");
          return r.json();
        });

      window.postMessage(
        {
          source: EXT_SOURCE,
          type: "INSTALL_PRESENCE",
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
      setInstallingVersion(null);
      toast.success(t("versionChanged", { platform: platform.name, version }));
    } catch {
      toast.error(t("versionChangeError", { platform: platform.name, version }));
      setInstallingVersion(null);
    }
  }, [extDetected, platform.slug]);

  // const handleSelectVersion = useCallback((version: string): void => {
  //   if (!extDetected) {
  //     toast.info(t("extNotDetected"));
  //     return;
  //   }

  //   if (installedVersion && compareVersions(version, installedVersion) < 0) {
  //     setPendingVersion(version);
  //     setShowDowngradeConfirm(true);
  //   } else {
  //     installVersion(version);
  //   }
  // }, [extDetected, installedVersion, platform.slug]);

  const confirmDowngrade = useCallback((): void => {
    if (pendingVersion) {
      setShowDowngradeConfirm(false);
      installVersion(pendingVersion);
      setPendingVersion(null);
    }
  }, [pendingVersion]);

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-300 mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href={`/${locale}/library`} className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{platform.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-4">
            <div className="space-y-4">
              <HeaderCard
                platform={platform}
                isInstalled={isInstalled}
                isExtDetected={extDetected}
                locale={locale}
                needsUpdate={needsUpdate}
                loading={loading}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
              />

              <SupportedUrlsCard urls={platform.supportedUrls} />
              <FeaturesCard platform={platform} locale={locale} />

            </div>

            <div className="space-y-4">
              <DevelopmentCard platform={platform} />
              <SettingsCard platform={platform} />

              <StatsCard
                platform={{
                  ...platform,
                  totalInstalls
                }}
                locale={locale}
                slug={platform.slug}
                canRate={extDetected && isInstalled}
                savedRating={savedRating}
                deviceId={deviceId}
              />

              <InstallVersionsCard
                platform={platform}
              />
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showUninstallConfirm} onOpenChange={setShowUninstallConfirm}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogMedia>
              <Trash2 className="w-5 h-5" />
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

      <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogMedia>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </DialogMedia>
            <DialogTitle>{t("downgradeConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("downgradeConfirmDescription", { platform: platform.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogAction onClick={confirmDowngrade}>{t("downgradeConfirmAction")}</DialogAction>
            <DialogCancel>{t("downgradeConfirmCancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
