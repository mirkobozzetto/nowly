import { API_BASE_URL } from "@/lib/constants";
import type { Platform } from "@/lib/data/platforms";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EXT_SOURCE, fireAndForget, nextId } from "./utils";

type UsePlatformPresenceReturn = {
  isInstalled: boolean
  installedVersion: string | null
  loading: boolean
  extDetected: boolean
  totalInstalls: number
  savedRating: number
  deviceId: string | null
  needsUpdate: boolean
  pendingVersion: string | null
  handleInstall: () => Promise<void>
  handleUninstallRequest: () => void
  confirmUninstall: () => void
  installVersion: (version: string) => Promise<void>
  confirmDowngrade: () => void
  showUninstallConfirm: boolean
  setShowUninstallConfirm: (open: boolean) => void
  showDowngradeConfirm: boolean
  setShowDowngradeConfirm: (open: boolean) => void
};

export const usePlatformPresence = (platform: Platform): UsePlatformPresenceReturn => {
  const t = useTranslations("MarketplaceDetail");

  const [isInstalled, setIsInstalled] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extDetected, setExtDetected] = useState(false);
  const [totalInstalls, setTotalInstalls] = useState(platform.totalInstalls);
  const [savedRating, setSavedRating] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const [pendingVersion, setPendingVersion] = useState<string | null>(null);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  const needsUpdate = useMemo(() => {
    return extDetected && isInstalled && installedVersion !== null && installedVersion !== platform.version;
  }, [extDetected, installedVersion, isInstalled, platform.version]);

  useEffect(() => {
    let gotInstalledResponse = false;

    const ping = setInterval(() => {
      window.postMessage({ source: EXT_SOURCE, type: "PING" }, "*");
    }, 300);

    const pingTimeout = setTimeout(() => clearInterval(ping), 5000);

    const stopPing = (): void => {
      clearInterval(ping);
      clearTimeout(pingTimeout);
    };

    const handler = (event: MessageEvent): void => {
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

        gotInstalledResponse = true;
        stopPing();

        if (installed) {
          setIsInstalled(true);
          setInstalledVersion(installed.metadata?.version ?? null);
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
      stopPing();
    };
  }, [platform.name, platform.slug, t]);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!extDetected) {
      toast.info(t("extNotDetected"));
      setIsInstalled((current) => !current);
      return;
    }

    setLoading(true);

    try {
      const release = await fetch(
        `${API_BASE_URL}/presences/${platform.slug}?v=${encodeURIComponent(platform.version ?? "dev")}`,
        { cache: "no-store" },
      ).then((response) => response.json());

      if (!isInstalled) {
        fireAndForget(`${API_BASE_URL}/presences/${platform.slug}/installs`, { method: "POST" });
        setTotalInstalls((current) => current + 1);
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
    } catch {
      toast.error(t("installError", { platform: platform.name }));
    } finally {
      setLoading(false);
    }
  }, [extDetected, isInstalled, needsUpdate, platform.name, platform.slug, platform.version, t]);

  const handleUninstallRequest = useCallback((): void => {
    setShowUninstallConfirm(true);
  }, []);

  const confirmUninstall = useCallback((): void => {
    setIsInstalled(false);
    setInstalledVersion(null);
    setShowUninstallConfirm(false);

    window.postMessage(
      {
        source: EXT_SOURCE,
        type: "UNINSTALL_PRESENCE",
        messageId: nextId(),
        payload: { slug: platform.slug },
      },
      "*",
    );
  }, [platform.slug]);

  const installVersion = useCallback(async (version: string): Promise<void> => {
    try {
      const release = await fetch(
        `${API_BASE_URL}/presences/${platform.slug}/versions/${encodeURIComponent(version)}`,
        { cache: "no-store" },
      ).then((response) => {
        if (!response.ok) {
          throw new Error("version not found");
        }

        return response.json();
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
      toast.success(t("versionChanged", { platform: platform.name, version }));
    } catch {
      toast.error(t("versionChangeError", { platform: platform.name, version }));
    }
  }, [platform.name, platform.slug, t]);

  const confirmDowngrade = useCallback((): void => {
    if (!pendingVersion) {
      return;
    }

    setShowDowngradeConfirm(false);
    installVersion(pendingVersion);
    setPendingVersion(null);
  }, [installVersion, pendingVersion]);

  return {
    isInstalled,
    installedVersion,
    loading,
    extDetected,
    totalInstalls,
    savedRating,
    deviceId,
    needsUpdate,
    pendingVersion,
    handleInstall,
    handleUninstallRequest,
    confirmUninstall,
    installVersion,
    confirmDowngrade,
    showUninstallConfirm,
    setShowUninstallConfirm,
    showDowngradeConfirm,
    setShowDowngradeConfirm,
  };
};
