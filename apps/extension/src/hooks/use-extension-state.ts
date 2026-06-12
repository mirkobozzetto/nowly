import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDebug } from "@/shared/types";
import { WEB_BASE_URL } from "@/shared/constants";
import { sendMessage, type NativeStatus } from "@/lib/messages";

type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

type ExtensionState = {
  activity: CurrentActivity | null;
  checkUpdates: () => void;
  checkHostUpdate: () => void;
  hostVersionInfo: HostVersionInfo | null;
  connectNative: () => void;
  debug: PresenceDebug | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isCheckingUpdates: boolean;
  isCheckingHostVersion: boolean;
  nativeStatus: NativeStatus;
  presences: InstalledPresences;
  removePresence: (slug: string) => void;
  togglePresence: (slug: string, enabled: boolean) => void;
  updates: Record<string, string>;
  settings: ExtensionSettings;
  setSettings: (partial: Partial<ExtensionSettings>) => void;
};

const FALLBACK_NATIVE_STATUS: NativeStatus = {
  connected: false,
  status: "unknown",
  discordConnected: false,
};

const FALLBACK_SETTINGS: ExtensionSettings = {
  presenceDisplayMode: "category",
  separateActivePresence: false,
  showPlayer: true,
};

export const useExtensionState = (): ExtensionState => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS);
  const [debug, setDebug] = useState<PresenceDebug | null>(null);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isCheckingHostVersion, setIsCheckingHostVersion] = useState(false);
  const [hostVersionInfo, setHostVersionInfo] = useState<HostVersionInfo | null>(null);
  const [settings, setSettingsState] = useState<ExtensionSettings>(FALLBACK_SETTINGS);

  const entries = useMemo(() => Object.entries(presences), [presences]);

  const fetchHostVersion = useCallback(async (): Promise<void> => {
    try {
      const url = `${WEB_BASE_URL.replace(/\/$/, "")}/host/version`;
      const [res, currentStatus] = await Promise.all([
        fetch(url, { signal: AbortSignal.timeout(5000) }),
        sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
      ]);
      if (!res.ok) throw new Error("failed to fetch host version");
      const data = await res.json() as { version: string };
      if (typeof data.version !== "string" || !data.version) throw new Error("host version missing");
      const currentVersion = currentStatus?.version;
      setHostVersionInfo({
        currentVersion,
        latestVersion: data.version,
        updateAvailable: Boolean(currentVersion && data.version !== currentVersion),
      });
    } catch {
      // Host unreachable — keep previous state
    }
  }, []);

  const checkHostUpdate = useCallback((): void => {
    if (isCheckingHostVersion) return;
    setIsCheckingHostVersion(true);
    void fetchHostVersion().finally(() => setIsCheckingHostVersion(false));
  }, [fetchHostVersion, isCheckingHostVersion]);

  const refresh = useCallback((): void => {
    void Promise.all([
      sendMessage<InstalledPresences>("GET_PRESENCES"),
      sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
      sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
      sendMessage<PresenceDebug | null>("GET_DEBUG"),
      sendMessage<ExtensionSettings>("GET_SETTINGS"),
    ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug, nextSettings]) => {
      setPresences(nextPresences ?? {});
      setActivity(nextActivity ?? null);
      setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
      setDebug(nextDebug ?? null);
      setSettingsState(nextSettings ?? FALLBACK_SETTINGS);
    });
    void fetchHostVersion();
  }, []);

  const refreshUpdates = useCallback((): void => {
    setIsCheckingUpdates(true);
    void sendMessage<Record<string, string>>("CHECK_UPDATES")
      .then((nextUpdates) => {
        setUpdates(nextUpdates ?? {});
      })
      .finally(() => {
        setIsCheckingUpdates(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 3600000);

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== "local") return;
      if (changes.presences || changes.settings || changes.currentActivity || changes.debug) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(onStorageChanged);

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source === "PRESENCES_BACKGROUND" && message.type === "PRESENCES_CHANGED") {
        refresh();
        refreshUpdates();
      }
    };
    chrome.runtime.onMessage.addListener(onRuntimeMessage);

    return () => {
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(onStorageChanged);
      chrome.runtime.onMessage.removeListener(onRuntimeMessage);
    };
  }, [refresh]);

  const togglePresence = (slug: string, enabled: boolean): void => {
    void sendMessage("TOGGLE_PRESENCE", { slug, enabled }).then(() => {
      setPresences((current) => {
        const presence = current[slug];
        if (!presence) return current;
        return { ...current, [slug]: { ...presence, enabled } };
      });
    });
  };

  const removePresence = (slug: string): void => {
    void sendMessage("UNINSTALL_PRESENCE", { slug }).then(() => {
      setPresences((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
    });
  };

  const connectNative = (): void => {
    setNativeStatus((current) => ({ ...current, status: "connecting" }));
    void sendMessage<NativeStatus>("CONNECT_NATIVE").then((status) => {
      setNativeStatus(status ?? FALLBACK_NATIVE_STATUS);
    });
  };

  const setSettings = useCallback((partial: Partial<ExtensionSettings>): void => {
    void sendMessage<ExtensionSettings>("SET_SETTINGS", partial).then((next) => {
      if (next) setSettingsState(next);
    });
  }, []);

  return {
    activity,
    checkUpdates: refreshUpdates,
    checkHostUpdate,
    hostVersionInfo,
    isCheckingHostVersion,
    connectNative,
    debug,
    entries,
    isCheckingUpdates,
    nativeStatus,
    presences,
    removePresence,
    togglePresence,
    updates,
    settings,
    setSettings,
  };
};
