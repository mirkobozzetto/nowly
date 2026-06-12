export type { LocaleShort as Locale } from "@nowly/locales";

export type NativeMessage =
  | { type: "PING" }
  | { type: "SET_ACTIVITY"; presence: PresencePayload }
  | { type: "CLEAR_ACTIVITY" };

export type NativeResponse =
  | {
      type: "PONG";
      connected: boolean;
      status: string;
      version?: string;
      discordConnected?: boolean;
      profile?: DiscordProfileSnapshot | null;
    }
  | { type: "CONNECTED"; version?: string }
  | { type: "OK" }
  | { type: "ERROR"; error: string };

export type DiscordProfileSnapshot = {
  id: string;
  username: string;
  globalName?: string;
  avatar?: string;
};

export type PresencePayload = {
  name?: string;
  details?: string;
  state?: string;
  startTime?: number;
  endTime?: number;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  type?: number;
  buttons?: { label: string; url: string }[];
};

export type PresenceData = {
  name?: string;
  appName?: string;
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  type?: number;
  buttons?: { label: string; url: string }[];
};

export type PresenceMetadata = {
  slug: string;
  name: string;
  author: { name: string; github?: string };
  contributors?: { name: string; github?: string }[];
  description: Record<string, string>;
  longDescription?: Record<string, string>;
  url: string[];
  regExp?: string;
  color: string;
  category: "streaming" | "music" | "tv" | "anime" | "other";
  features?: Record<string, string[]>;
  version?: string | null;
  settings?: Record<string, unknown>;
  assets: {
    logo: string;
    icon: string;
    thumbnail: string;
  };
};

export type PresenceRelease = {
  slug: string;
  version: string;
  metadata: PresenceMetadata;
  bundle: string;
  sha256: string;
  metadataHash: string;
  signature: string;
  signedAt: string;
};

export type StoredPresence = {
  metadata: PresenceMetadata;
  release: PresenceRelease;
  enabled: boolean;
  installedAt: number;
  updatedAt?: number;
};

export type InstalledPresences = Record<string, StoredPresence>;

export type CurrentActivity = {
  slug: string;
  presence: PresencePayload;
  updatedAt: number;
};

export type PresenceDebug = {
  stage: string;
  message: string;
  url?: string;
  updatedAt: number;
};

export type WebMessageType =
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "GET_INSTALLED"
  | "SAVE_USER_RATING"
  | "GET_USER_RATINGS";

export type PresenceDisplayMode = "category" | "alphabetical";

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode;
  separateActivePresence: boolean;
  showPlayer: boolean;
  analyticsConsent?: boolean;
  customApiBaseUrl?: string;
};

export type PresenceSettings = Record<string, unknown>;

export type ExtensionMessageType =
  | "GET_PRESENCES"
  | "GET_INSTALLED"
  | "GET_NATIVE_STATUS"
  | "GET_USER_SCRIPTS_STATUS"
  | "CONNECT_NATIVE"
  | "GET_CURRENT_ACTIVITY"
  | "GET_DEBUG"
  | "TOGGLE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "ACTIVITY_UPDATE"
  | "CLEAR_ACTIVITY"
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "DEBUG"
  | "CHECK_UPDATES"
  | "GET_SETTINGS"
  | "SET_SETTINGS"
  | "GET_PRESENCE_SETTINGS"
  | "SET_PRESENCE_SETTINGS";

export type UserScriptsStatus = {
  enabled: boolean;
  reason?: string;
  // Chrome requires an explicit user toggle in the extension details UI.
  // This is surfaced so onboarding can explain what to do.
  requiresUserToggle?: boolean;
};

export type WebMessage = {
  source: typeof import("./constants").EXT_WEB_SOURCE;
  type: WebMessageType | "PING";
  payload?: unknown;
  messageId?: string;
};

export type ExtensionMessage = {
  source: "PRESENCES_POPUP" | "PRESENCES_CONTENT";
  type: ExtensionMessageType;
  payload?: unknown;
};
