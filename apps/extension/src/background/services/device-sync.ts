import { WEB_BASE_URL } from "@/shared/constants";
import { addAnalyticsLog } from "@/background/analytics/analytics-log";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getCachedDeviceId, setCachedDeviceId } from "@/background/services/background-context";
import { browserName, osName } from "@/background/services/device-info";
import { getDeviceId, getDeviceToken, getPresences, getSettings, setDeviceToken } from "@/background/services/storage";

type SyncPresence = {
  slug: string;
  version?: string;
  enabled?: boolean;
  installed?: boolean;
};

export const getActiveDeviceId = async (): Promise<string> => {
  const cachedDeviceId = getCachedDeviceId();
  if (cachedDeviceId) return cachedDeviceId;
  const deviceId = await getDeviceId();
  setCachedDeviceId(deviceId);
  return deviceId;
};

export const buildDeviceUrl = async (path: string): Promise<string> => {
  const deviceId = await getActiveDeviceId();
  const params = new URLSearchParams({ deviceId });
  const token = await getDeviceToken();
  if (token) params.set("token", token);
  return `${WEB_BASE_URL}${path}?${params.toString()}`;
};

export const syncUninstallUrl = async (): Promise<void> => {
  try {
    chrome.runtime.setUninstallURL(await buildDeviceUrl("/uninstall"));
  } catch {
    // Best effort only.
  }
};

export const syncDeviceState = async (extraPresences: SyncPresence[] = []): Promise<void> => {
  const [deviceId, presences, settings] = await Promise.all([
    getActiveDeviceId(),
    getPresences(),
    getSettings(),
  ]);

  const syncedPresences = [
    ...Object.entries(presences).map(([slug, presence]) => ({
      slug,
      version: presence.release?.version ?? presence.metadata?.version ?? undefined,
      enabled: presence.enabled,
      installed: true,
    })),
    ...extraPresences,
  ];

  addAnalyticsLog("info", "api", "POST /devices/sync", { presenceCount: syncedPresences.length });

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/devices/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        analyticsConsent: settings.analyticsConsent === true,
        extensionVersion: chrome.runtime.getManifest().version,
        browser: browserName(),
        os: osName(),
        presences: syncedPresences,
      }),
    });
    addAnalyticsLog(response.ok ? "success" : "warn", "api", "POST /devices/sync result", { status: response.status });
    if (response.ok) {
      try {
        const data = (await response.json()) as { deviceToken?: unknown };
        if (typeof data.deviceToken === "string" && data.deviceToken) {
          const existing = await getDeviceToken();
          if (existing !== data.deviceToken) {
            await setDeviceToken(data.deviceToken);
            // Refresh the uninstall URL so the cleanup request carries the token.
            await syncUninstallUrl();
          }
        }
      } catch {
        // Response body is best-effort; ignore parse failures.
      }
    }
  } catch (error) {
    addAnalyticsLog("error", "api", "POST /devices/sync failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};