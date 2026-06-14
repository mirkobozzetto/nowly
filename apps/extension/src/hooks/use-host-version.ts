import { sendMessage, type NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { useCallback, useState } from "react";

export type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

export type UseHostVersion = {
  hostVersionInfo: HostVersionInfo | null;
  isCheckingHostVersion: boolean;
  checkHostUpdate: () => void;
  fetchHostVersion: () => Promise<void>;
};

/** Fetches the latest native-host version and compares it with the connected one. */
export const useHostVersion = (): UseHostVersion => {
  const [isCheckingHostVersion, setIsCheckingHostVersion] = useState(false);
  const [hostVersionInfo, setHostVersionInfo] = useState<HostVersionInfo | null>(null);

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

  return { hostVersionInfo, isCheckingHostVersion, checkHostUpdate, fetchHostVersion };
};
