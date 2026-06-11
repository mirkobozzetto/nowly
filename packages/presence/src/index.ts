export type LocaleString = {
  "fr-FR"?: string;
  "en-US"?: string;
  "es-ES"?: string;
};

export type BooleanSetting = {
  type: "boolean";
  default: boolean;
  label: LocaleString;
  description?: LocaleString;
};

export type InputSetting = {
  type: "input";
  default: string;
  label: LocaleString;
  description?: LocaleString;
  placeholder?: LocaleString;
};

export type SelectOption = {
  value: string;
  label: LocaleString;
};

export type SelectSetting = {
  type: "select";
  default: string;
  options: SelectOption[];
  label: LocaleString;
  description?: LocaleString;
};

export type SliderSetting = {
  type: "slider";
  default: number;
  label: LocaleString;
  description?: LocaleString;
  min?: number;
  max?: number;
  step?: number;
};

export type PresenceSetting = BooleanSetting | InputSetting | SelectSetting | SliderSetting;

type ShorthandValue = boolean | string | number;

type SettingDefinition = ShorthandValue | PresenceSetting;

type InferValue<T> =
  T extends BooleanSetting ? boolean
  : T extends InputSetting ? string
  : T extends SelectSetting ? string
  : T extends SliderSetting ? number
  : T extends boolean ? boolean
  : T extends string ? string
  : T extends number ? number
  : never;

export type InferSettings<T extends Record<string, SettingDefinition>> = {
  [K in keyof T]: InferValue<T[K]>;
};

export type PresenceButton = {
  label: string;
  url: string;
};

export type PresenceData = {
  appName?: string;
  name?: string;
  details?: string;
  state?: string;
  startTimestamp?: number;
  endTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  type?: PresenceTypeValue;
  buttons?: PresenceButton[];
};

export const PresenceType = {
  Playing: 0,
  Streaming: 1,
  Listening: 2,
  Watching: 3,
  Competing: 5,
} as const;

export type PresenceTypeValue = typeof PresenceType[keyof typeof PresenceType];

export type PresenceEventName = "UpdateData" | "iFrameData";

export type UpdateDataContext<S extends Record<string, unknown> = Record<string, unknown>> = {
  settings: S;
};

export type PresenceInstance<S extends Record<string, unknown> = Record<string, unknown>> = {
  on(eventName: "UpdateData", listener: (ctx: UpdateDataContext<S>) => void | Promise<void>): void;
  on(eventName: PresenceEventName, listener: (...args: unknown[]) => void | Promise<void>): void;
  setActivity(data: PresenceData): Promise<void>;
  clearActivity(): void;
  getStrings<T extends Record<string, string>>(strings: T): Promise<T>;
  getSetting<T extends string | boolean | number = string>(key?: string): Promise<T | undefined>;
  info(message: string): void;
  error(message: string): void;
};

export type PresenceAssets = {
  readonly Logo: string;
  readonly Icon: string;
  readonly Thumbnail: string;
};

export type PresenceConstructor = {
  new(): PresenceInstance;
  new<S extends Record<string, unknown>>(settings: S): PresenceInstance<S>;
  Settings: <T extends Record<string, SettingDefinition>>(definitions: T) => InferSettings<T>;
  Assets: <T extends Record<string, string>>(assets: T) => { [K in keyof T]: string };
};

declare global {
  const Presence: PresenceConstructor;
  const Assets: PresenceAssets;
}

export const createMediaTimestamps = (
  media: Pick<HTMLMediaElement, "currentTime" | "duration" | "paused">,
  now = Math.floor(Date.now() / 1000),
): Pick<PresenceData, "startTimestamp" | "endTimestamp"> => {
  if (media.paused) return {};

  return {
    startTimestamp: now - Math.floor(media.currentTime),
    endTimestamp: Number.isFinite(media.duration)
      ? now + Math.floor(media.duration - media.currentTime)
      : undefined,
  };
};

export type ImageProxyService = "tiktok" | (string & {});
const DISCORD_IMAGE_KEY_MAX_LENGTH = 300;
const IMAGE_PROXY_BASE_URL = "https://api.nowly.me/image-proxy";
const SHORT_IMAGE_PROXY_BASE_URL = "https://api.nowly.me/i";
const CACHED_IMAGE_PROXY_BASE_URL = "https://api.nowly.me/images-proxy";
const CACHED_IMAGE_REFRESH_GRACE_MS = 30 * 1000;

type CachedImageProxyEntry = {
  url: string;
  expiresAt: number;
};

const cachedImageProxyUrls = new Map<string, CachedImageProxyEntry>();

export const createImageProxyUrl = (
  service: ImageProxyService,
  imageUrl: string | undefined,
): string | undefined => {
  if (!imageUrl?.startsWith("https://")) return undefined;
  const proxyUrl = `${SHORT_IMAGE_PROXY_BASE_URL}?u=${encodeURIComponent(imageUrl)}`;
  return proxyUrl.length <= DISCORD_IMAGE_KEY_MAX_LENGTH ? proxyUrl : undefined;
};

export const createImageProxyPath = (
  service: ImageProxyService,
  ...parts: Array<string | number | undefined>
): string | undefined => {
  if (parts.some(part => part === undefined || String(part).trim() === "")) return undefined;
  const path = [
    IMAGE_PROXY_BASE_URL,
    encodeURIComponent(service),
    ...parts.map(part => encodeURIComponent(String(part))),
  ].join("/");
  return path.length <= DISCORD_IMAGE_KEY_MAX_LENGTH ? path : undefined;
};

export const createCachedImageProxyUrl = async (
  service: ImageProxyService,
  imageUrl: string | undefined,
): Promise<string | undefined> => {
  if (!imageUrl?.startsWith("https://")) return undefined;

  const cacheKey = `${service}:${imageUrl}`;
  const cached = cachedImageProxyUrls.get(cacheKey);
  if (cached && cached.expiresAt - CACHED_IMAGE_REFRESH_GRACE_MS > Date.now()) {
    return cached.url;
  }

  try {
    const response = await fetch(CACHED_IMAGE_PROXY_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, url: imageUrl }),
    });

    if (!response.ok) return undefined;

    const data = await response.json() as { url?: string; expiresIn?: number };
    if (!data.url?.startsWith("https://") || data.url.length > DISCORD_IMAGE_KEY_MAX_LENGTH) {
      return undefined;
    }

    cachedImageProxyUrls.set(cacheKey, {
      url: data.url,
      expiresAt: Date.now() + Math.max(1, data.expiresIn ?? 300) * 1000,
    });

    return data.url;
  } catch {
    return undefined;
  }
};
