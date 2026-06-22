import { getPresenceVersion } from "./activity-manager";
import { addAnalyticsLog } from "./analytics-log";
import { flushAnalytics, trackAnalytics } from "./analytics-tracker";
import { getEffectiveApiUrl } from "./api-state";
import { getActiveSlugsSnapshot, hasActiveSlugs } from "./background-context";
import { getActiveDeviceId, syncDeviceState } from "./device-sync";
import { postNative } from "./native";

export const registerAlarmHandlers = (): void => {
  chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });
  chrome.alarms.create("api-heartbeat", { periodInMinutes: 5 });
  chrome.alarms.create("analytics-flush", { periodInMinutes: 2 });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
    if (alarm.name === "api-heartbeat" && hasActiveSlugs()) {
      void (async () => {
        const slugs = getActiveSlugsSnapshot();
        const deviceId = await getActiveDeviceId();
        addAnalyticsLog("info", "api", "POST /presences/active", { count: slugs.length });
        try {
          const response = await fetch(`${getEffectiveApiUrl()}/presences/active`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presences: slugs, deviceId }),
          });
          addAnalyticsLog(response.ok ? "success" : "warn", "api", "POST /presences/active result", { status: response.status, count: slugs.length });
        } catch (error) {
          addAnalyticsLog("error", "api", "POST /presences/active failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        void syncDeviceState();
        for (const slug of slugs) {
          void trackAnalytics("presence_active_heartbeat", {
            slug,
            version: await getPresenceVersion(slug),
            payload: { source: "heartbeat" },
          });
        }
      })();
    }
    if (alarm.name === "analytics-flush") void flushAnalytics();
  });
};