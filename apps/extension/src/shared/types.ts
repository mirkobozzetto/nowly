export type Locale = "fr" | "en";

export type NativeMessage =
  | { type: "PING" }
  | { type: "SET_ACTIVITY"; presence: PresencePayload }
  | { type: "CLEAR_ACTIVITY" };

export type NativeResponse =
  | { type: "PONG"; connected: boolean; status: string }
  | { type: "CONNECTED" }
  | { type: "OK" }
  | { type: "ERROR"; error: string };

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
};

export type PresenceData = {
  name?: string;
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
  description: Record<string, string>;
  url: string[];
  regExp?: string;
  color: string;
  category: "streaming" | "music" | "tv" | "anime" | "other";
  tags: string[];
  version?: string | null;
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
  | "GET_INSTALLED";

export type ExtensionMessageType =
  | "GET_PRESENCES"
  | "GET_INSTALLED"
  | "GET_NATIVE_STATUS"
  | "CONNECT_NATIVE"
  | "GET_CURRENT_ACTIVITY"
  | "GET_DEBUG"
  | "TOGGLE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "ACTIVITY_UPDATE"
  | "CLEAR_ACTIVITY"
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "DEBUG";

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
