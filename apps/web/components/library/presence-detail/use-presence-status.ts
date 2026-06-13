import { API_BASE_URL } from "@/lib/constants";
import { trackPublicAnalytics } from "@/lib/analytics-client";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EXT_SOURCE, nextId } from "./utils";

type UsePresenceStatusReturn = {
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
  requestInstallVersion: (version: string) => void
  confirmUninstall: () => void
  installVersion: (version: string) => Promise<void>
  confirmDowngrade: () => void
  showUninstallConfirm: boolean
  setShowUninstallConfirm: (open: boolean) => void
  showDowngradeConfirm: boolean
  setShowDowngradeConfirm: (open: boolean) => void
};

export const usePresenceStatus = (presence: Presence): UsePresenceStatusReturn => {
  const t = useTranslations("MarketplaceDetail");

  const [isInstalled, setIsInstalled] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extDetected, setExtDetected] = useState(false);
  const [totalInstalls] = useState(presence.totalInstalls);
  const [savedRating, setSavedRating] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const [pendingVersion, setPendingVersion] = useState<string | null>(null);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  const needsUpdate = useMemo(() => {
    return extDetected && isInstalled && installedVersion !== null && installedVersion !== presence.version;
  }, [extDetected, installedVersion, isInstalled, presence.version]);

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

        if (payload?.ratings?.[presence.slug]) {
          setSavedRating(payload.ratings[presence.slug]);
        }

        if (payload?.deviceId) {
          setDeviceId(payload.deviceId);
        }
      }

      if (msg.source === EXT_SOURCE && msg.type === "INSTALLED_PRESENCES") {
        const installed = msg.payload?.[presence.slug];

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
          setInstalledVersion(presence.version ?? null);
          setLoading(false);
          if (!isInstalled) {
            trackPublicAnalytics({
              key: "marketplace_conversion",
              slug: presence.slug,
              version: presence.version ?? undefined,
              payload: { source: "presence-detail" },
            });
          }
          toast.success(t("installSuccess", { platform: presence.name }));
        } else {
          setIsInstalled(false);
          setInstalledVersion(null);
          setLoading(false);
          toast.error(t("installError", { platform: presence.name }));
        }
      }

      if (msg.source === EXT_SOURCE && msg.type === "UNINSTALL_PRESENCE_RESULT") {
        if (msg.payload?.ok) {
          setIsInstalled(false);
          setInstalledVersion(null);
          toast.success(t("uninstallSuccess", { platform: presence.name }));
        }
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
      stopPing();
    };
  }, [isInstalled, presence.name, presence.slug, presence.version, t]);

  const handleInstall = useCallback(async (): Promise<void> => {
    if (!extDetected) {
      toast.info(t("extNotDetected"));
      setIsInstalled((current) => !current);
      return;
    }

    setLoading(true);
    trackPublicAnalytics({
      key: "marketplace_install_click",
      slug: presence.slug,
      version: presence.version ?? undefined,
      payload: { source: "presence-detail" },
    });

    try {
      const release = await fetch(
        `${API_BASE_URL}/presences/${presence.slug}?v=${encodeURIComponent(presence.version ?? "dev")}`,
        { cache: "no-store" },
      ).then((response) => response.json());

      window.postMessage(
        {
          source: EXT_SOURCE,
          type: needsUpdate ? "UPDATE_PRESENCE" : "INSTALL_PRESENCE",
          messageId: nextId(),
          payload: {
            slug: presence.slug,
            release,
          },
        },
        "*",
      );

    } catch {
      toast.error(t("installError", { platform: presence.name }));
      setLoading(false);
    }
  }, [extDetected, needsUpdate, presence.name, presence.slug, presence.version, t]);

  const handleUninstallRequest = useCallback((): void => {
    setShowUninstallConfirm(true);
  }, []);

  const requestInstallVersion = useCallback((version: string): void => {
    if (version === presence.version) {
      void handleInstall();
      return;
    }

    setPendingVersion(version);
    setShowDowngradeConfirm(true);
  }, [handleInstall, presence.version]);

  const confirmUninstall = useCallback((): void => {
    setIsInstalled(false);
    setInstalledVersion(null);
    setShowUninstallConfirm(false);

    window.postMessage(
      {
        source: EXT_SOURCE,
        type: "UNINSTALL_PRESENCE",
        messageId: nextId(),
        payload: { slug: presence.slug },
      },
      "*",
    );
  }, [presence.slug]);

  const installVersion = useCallback(async (version: string): Promise<void> => {
    try {
      const release = await fetch(
        `${API_BASE_URL}/presences/${presence.slug}/versions/${encodeURIComponent(version)}`,
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
            slug: presence.slug,
            release,
          },
        },
        "*",
      );

      setIsInstalled(true);
      setInstalledVersion(release.version ?? null);
      toast.success(t("versionChanged", { platform: presence.name, version }));
    } catch {
      toast.error(t("versionChangeError", { platform: presence.name, version }));
    }
  }, [presence.name, presence.slug, t]);

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
    requestInstallVersion,
    confirmUninstall,
    installVersion,
    confirmDowngrade,
    showUninstallConfirm,
    setShowUninstallConfirm,
    showDowngradeConfirm,
    setShowDowngradeConfirm,
  };
};
