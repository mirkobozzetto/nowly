import type { ExtensionSettings } from "@/shared/types";
import { addAnalyticsLog } from "./analytics-log";
import { trackAnalytics } from "./analytics-tracker";
import { setCustomApiUrl } from "./background-context";
import { syncDeviceState } from "./device-sync";
import { getSettings, setOnboarding, setSettings } from "./storage";

export const updateSettings = async (partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
  const previousSettings = await getSettings();
  const settings = await setSettings(partial);
  setCustomApiUrl(settings.customApiBaseUrl);
  void syncDeviceState();
  addAnalyticsLog("info", "settings", "settings changed", {
    analyticsConsent: settings.analyticsConsent === true,
    customApiEnabled: Boolean(settings.customApiBaseUrl),
    scheduleEnabled: settings.scheduleEnabled !== false,
  });

  const source = previousSettings.analyticsConsent === undefined ? "onboarding" : "settings";
  if (typeof partial.analyticsConsent === "boolean" && partial.analyticsConsent !== previousSettings.analyticsConsent) {
    void trackAnalytics(partial.analyticsConsent ? "analytics_consent_accepted" : "analytics_consent_declined", {
      payload: { source },
    });
    void trackAnalytics("analytics_consent_changed", {
      payload: { enabled: partial.analyticsConsent, source },
    });
  }
  if (partial.presenceDisplayMode || typeof partial.separateActivePresence === "boolean" || typeof partial.showPlayer === "boolean") {
    void trackAnalytics("settings_display_changed", {
      payload: {
        displayMode: settings.presenceDisplayMode,
        separateActivePresence: settings.separateActivePresence,
        showPlayer: settings.showPlayer,
      },
    });
  }
  if ("customApiBaseUrl" in partial) {
    void trackAnalytics("settings_custom_api_changed", {
      payload: { enabled: Boolean(partial.customApiBaseUrl) },
    });
  }

  return settings;
};

export const resetOnboardingForDev = async (): Promise<ExtensionSettings> => {
  await setOnboarding({ devReplayOnboarding: true, onboardingCompleted: false });
  const settings = await setSettings({ analyticsConsent: undefined });
  await syncDeviceState();
  addAnalyticsLog("info", "settings", "developer onboarding reset");
  return settings;
};