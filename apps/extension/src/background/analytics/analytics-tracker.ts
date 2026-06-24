import { addAnalyticsLog, sanitizeLogPayload } from "./analytics-log";
import { getEffectiveApiUrl } from "../services/api-state";
import { browserName, osName } from "../services/device-info";
import { getActiveDeviceId } from "../services/device-sync";
import { getSettings } from "../services/storage";

type AnalyticsEvent = {
  key: string;
  slug?: string;
  version?: string;
  payload?: Record<string, unknown>;
};

let analyticsQueue: AnalyticsEvent[] = [];
let lastExtensionOpenTrackedAt = 0;

export const flushAnalytics = async (): Promise<void> => {
  if (!analyticsQueue.length) return;
  const settings = await getSettings();
  if (settings.analyticsConsent !== true) {
    addAnalyticsLog("warn", "analytics", "analytics queue dropped: consent disabled", { count: analyticsQueue.length });
    analyticsQueue = [];
    return;
  }

  const deviceId = await getActiveDeviceId();
  const events = analyticsQueue.splice(0, analyticsQueue.length).map((event) => ({
    ...event,
    deviceId,
    payload: {
      extensionVersion: chrome.runtime.getManifest().version,
      browser: browserName(),
      os: osName(),
      ...(event.payload ?? {}),
    },
  }));

  addAnalyticsLog("info", "analytics", "POST /analytics/events", { count: events.length });

  try {
    const response = await fetch(`${getEffectiveApiUrl()}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    addAnalyticsLog(response.ok ? "success" : "warn", "analytics", "POST /analytics/events result", { status: response.status });
    if (!response.ok) {
      analyticsQueue.unshift(...events.map(({ deviceId: _deviceId, ...event }) => event));
    }
  } catch (error) {
    addAnalyticsLog("error", "analytics", "POST /analytics/events failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    analyticsQueue.unshift(...events.map(({ deviceId: _deviceId, ...event }) => event));
  }
};

export const trackAnalytics = async (
  key: string,
  event: { slug?: string; version?: string; payload?: Record<string, unknown> } = {},
): Promise<void> => {
  const settings = await getSettings();
  if (settings.analyticsConsent !== true) {
    addAnalyticsLog("warn", "analytics", "analytics event skipped: consent disabled", { key });
    return;
  }
  addAnalyticsLog("info", "analytics", "analytics event queued", {
    key,
    slug: event.slug,
    version: event.version,
    ...sanitizeLogPayload(event.payload),
  });
  analyticsQueue.push({ key, ...event });
  if (analyticsQueue.length >= 10) await flushAnalytics();
};

export const trackExtensionOpen = (): void => {
  const now = Date.now();
  if (now - lastExtensionOpenTrackedAt < 60_000) return;
  lastExtensionOpenTrackedAt = now;
  void trackAnalytics("extension_open", { payload: { surface: "extension" } });
};