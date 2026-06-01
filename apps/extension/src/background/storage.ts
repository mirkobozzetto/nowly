import type { CurrentActivity, InstalledPresences, PresenceDebug } from "../shared/types";

const PRESENCES_KEY = "presences";
const ACTIVITY_KEY = "currentActivity";
const DEBUG_KEY = "presenceDebug";

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