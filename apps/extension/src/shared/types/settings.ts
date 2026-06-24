import type { PresenceSchedule } from "./presence";

export type PresenceDisplayMode = "category" | "alphabetical";
export type AccentTheme = "default" | "donator" | "fleuri" | "violet" | "vert" | "orange";

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode;
  separateActivePresence: boolean;
  showPlayer: boolean;
  analyticsConsent?: boolean;
  developerMode?: boolean;
  customApiBaseUrl?: string;
  scheduleEnabled?: boolean;
  globalSchedule?: PresenceSchedule;
  theme?: AccentTheme;
  backgroundAnimation?: boolean;
};
