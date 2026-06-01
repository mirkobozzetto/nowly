import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDebug } from "../../shared/types";
import { sendMessage, type NativeStatus } from "../lib/messages";

type ExtensionState = {
  activity: CurrentActivity | null;
  connectNative: () => void;
  debug: PresenceDebug | null;
  entries: Array<[string, InstalledPresences[string]]>;
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
  const [settings, setSettingsState] = useState<ExtensionSettings>(FALLBACK_SETTINGS);

  const entries = useMemo(() => Object.entries(presences), [presences]);

  useEffect(() => {
    const refresh = (): void => {
      void Promise.all([
        sendMessage<InstalledPresences>("GET_PRESENCES"),
        sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
        sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
        sendMessage<PresenceDebug | null>("GET_DEBUG"),
        sendMessage<Record<string, string>>("CHECK_UPDATES"),
        sendMessage<ExtensionSettings>("GET_SETTINGS"),
      ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug, nextUpdates, nextSettings]) => {
        setPresences(nextPresences ?? {});
        setActivity(nextActivity ?? null);
        setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
        setDebug(nextDebug ?? null);
        setUpdates(nextUpdates ?? {});
        setSettingsState(nextSettings ?? FALLBACK_SETTINGS);
      });
    };

    refresh();
    const interval = window.setInterval(refresh, 10000);
    return () => window.clearInterval(interval);
  }, []);

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
    connectNative,
    debug,
    entries,
    nativeStatus,
    presences,
    removePresence,
    togglePresence,
    updates,
    settings,
    setSettings,
  };
};
