import type { CurrentActivity, DiscordProfileSnapshot, ExtensionSettings, InstalledPresences, PresenceDebug, PresenceDisplayMode, PresenceSettings } from "@/shared/types";

const PRESENCES_KEY = "presences";
const ACTIVITY_KEY = "currentActivity";
const DEBUG_KEY = "presenceDebug";
const ONBOARDING_KEY = "onboarding";
const SETTINGS_KEY = "settings";
const PRESENCE_SETTINGS_KEY = "presenceSettings";
const DEVICE_ID_KEY = "deviceId";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  presenceDisplayMode: "category" as PresenceDisplayMode,
  separateActivePresence: false,
};

export const getPresences = (): Promise<InstalledPresences> =>
  chrome.storage.local.get(PRESENCES_KEY).then((result) => (
    (result[PRESENCES_KEY] ?? {}) as InstalledPresences
  ));

export const setPresences = (presences: InstalledPresences): Promise<void> =>
  chrome.storage.local.set({ [PRESENCES_KEY]: presences });

export const getCurrentActivity = (): Promise<CurrentActivity | null> =>
  chrome.storage.local.get(ACTIVITY_KEY).then((result) => (
    (result[ACTIVITY_KEY] ?? null) as CurrentActivity | null
  ));

export const setCurrentActivity = (activity: CurrentActivity | null): Promise<void> =>
  chrome.storage.local.set({ [ACTIVITY_KEY]: activity });

export const getDebug = (): Promise<PresenceDebug | null> =>
  chrome.storage.local.get(DEBUG_KEY).then((result) => (
    (result[DEBUG_KEY] ?? null) as PresenceDebug | null
  ));

export const setDebug = (debug: PresenceDebug): Promise<void> =>
  chrome.storage.local.set({ [DEBUG_KEY]: debug });

export type OnboardingState = {
  onboardingCompleted: boolean;
  nativeSeenConnectedOnce: boolean;
  nativeProfile?: DiscordProfileSnapshot | null;
};

const DEFAULT_ONBOARDING: OnboardingState = {
  onboardingCompleted: false,
  nativeSeenConnectedOnce: false,
  nativeProfile: null,
};

export const getOnboarding = async (): Promise<OnboardingState> => {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  const value = result[ONBOARDING_KEY] as Partial<OnboardingState> | undefined;
  return {
    ...DEFAULT_ONBOARDING,
    ...(value ?? {}),
  };
};

export const setOnboarding = async (partial: Partial<OnboardingState>): Promise<void> => {
  const current = await getOnboarding();
  await chrome.storage.local.set({ [ONBOARDING_KEY]: { ...current, ...partial } satisfies OnboardingState });
};

export const setNativeSeenConnectedOnce = (seen: boolean): Promise<void> =>
  setOnboarding({ nativeSeenConnectedOnce: seen });

export const setNativeProfile = (profile: DiscordProfileSnapshot | null): Promise<void> =>
  setOnboarding({ nativeProfile: profile });

export const getPresenceSettings = async (): Promise<Record<string, PresenceSettings>> => {
  const result = await chrome.storage.local.get(PRESENCE_SETTINGS_KEY);
  return (result[PRESENCE_SETTINGS_KEY] ?? {}) as Record<string, PresenceSettings>;
};

export const setPresenceSettings = async (slug: string, partial: PresenceSettings): Promise<PresenceSettings> => {
  const current = await getPresenceSettings();
  const next = { ...(current[slug] ?? {}), ...partial } satisfies PresenceSettings;
  current[slug] = next;
  await chrome.storage.local.set({ [PRESENCE_SETTINGS_KEY]: current });
  return next;
};

export const getSettings = async (): Promise<ExtensionSettings> => {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined) };
};

export const setSettings = async (partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
  const current = await getSettings();
  const next = { ...current, ...partial } satisfies ExtensionSettings;
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
};

export const getDeviceId = async (): Promise<string> => {
  const result = await chrome.storage.local.get(DEVICE_ID_KEY);
  const existing = result[DEVICE_ID_KEY];
  if (typeof existing === "string" && existing.trim()) {
    return existing;
  }

  const deviceId = crypto.randomUUID();
  await chrome.storage.local.set({ [DEVICE_ID_KEY]: deviceId });
  return deviceId;
};
