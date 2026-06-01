import { useEffect, useMemo, useState } from "react";
import type { CurrentActivity, InstalledPresences, PresenceDebug } from "../../shared/types";
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
};

const FALLBACK_NATIVE_STATUS: NativeStatus = {
  connected: false,
  status: "unknown",
  discordConnected: false,
};

export const useExtensionState = (): ExtensionState => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>(FALLBACK_NATIVE_STATUS);
  const [debug, setDebug] = useState<PresenceDebug | null>(null);

  const entries = useMemo(() => Object.entries(presences), [presences]);

  useEffect(() => {
    const refresh = (): void => {
      void Promise.all([
        sendMessage<InstalledPresences>("GET_PRESENCES"),
        sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
        sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
        sendMessage<PresenceDebug | null>("GET_DEBUG"),
      ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug]) => {
        setPresences(nextPresences ?? {});
        setActivity(nextActivity ?? null);
        setNativeStatus(nextNativeStatus ?? FALLBACK_NATIVE_STATUS);
        setDebug(nextDebug ?? null);
      });
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
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

  return {
    activity,
    connectNative,
    debug,
    entries,
    nativeStatus,
    presences,
    removePresence,
    togglePresence,
  };
};
