export type PresenceButton = {
  label: string;
  url: string;
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

export type PresenceInstance = {
  on(eventName: "UpdateData", listener: () => void | Promise<void>): void;
  on(eventName: PresenceEventName, listener: (...args: unknown[]) => void | Promise<void>): void;
  setActivity(data: PresenceData): Promise<void>;
  clearActivity(): void;
  getStrings<T extends Record<string, string>>(strings: T): Promise<T>;
  getSetting<T extends string | boolean | number = string>(key?: string): Promise<T | undefined>;
  info(message: string): void;
  error(message: string): void;
};

export type PresenceConstructor = {
  new(): PresenceInstance;
};

declare global {
  const Presence: PresenceConstructor;
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
