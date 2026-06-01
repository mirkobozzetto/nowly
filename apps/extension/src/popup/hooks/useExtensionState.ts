import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDebug } from "../../shared/types";
import { sendMessage, type NativeStatus } from "../lib/messages";

type ExtensionState = {
  activity: CurrentActivity | null;
  checkUpdates: () => void;
  connectNative: () => void;
  debug: PresenceDebug | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isCheckingUpdates: boolean;
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
};

export const useExtensionState = (): ExtensionState => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS);
  const [debug, setDebug] = useState<PresenceDebug | null>(null);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [settings, setSettingsState] = useState<ExtensionSettings>(FALLBACK_SETTINGS);

  const entries = useMemo(() => Object.entries(presences), [presences]);

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
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 3000);

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

  const checkUpdates = useCallback((): void => {
    setIsCheckingUpdates(true);
    void sendMessage<Record<string, string>>("CHECK_UPDATES")
      .then((nextUpdates) => {
        setUpdates(nextUpdates ?? {});
      })
      .finally(() => {
        setIsCheckingUpdates(false);
      });
  }, []);

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
    checkUpdates,
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
