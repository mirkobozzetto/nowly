import type { PresenceSchedule } from "./presence";

export type PresenceDisplayMode = "category" | "alphabetical";

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode;
  separateActivePresence: boolean;
  showPlayer: boolean;
  analyticsConsent?: boolean;
  developerMode?: boolean;
  customApiBaseUrl?: string;
  scheduleEnabled?: boolean;
  globalSchedule?: PresenceSchedule;
};
