import { NATIVE_HOST } from "@/shared/constants";
import type { NativeMessage, NativeResponse, PresenceData, PresencePayload } from "@/shared/types";
import { setNativeProfile, setNativeSeenConnectedOnce } from "./storage";

let nativePort: chrome.runtime.Port | null = null;
let connected = false;
let status = "not connected";
let connecting = false;
let discordConnected = false;
const responseListeners = new Set<(message: NativeResponse) => void>();

export const mapPresenceData = (data: PresenceData): PresencePayload => ({
  name: data.name,
  details: data.details,
  state: data.state,
  startTime: data.startTimestamp,
  endTime: data.endTimestamp,
  largeImage: data.largeImageKey,
  largeText: data.largeImageText,
  smallImage: data.smallImageKey,
  smallText: data.smallImageText,
  type: data.type,
});

export const getNativeStatus = () => ({ connected, status, discordConnected });

export const onNativeResponse = (listener: (message: NativeResponse) => void): (() => void) => {
  responseListeners.add(listener);
  return () => responseListeners.delete(listener);
};

export const refreshNativeStatus = (): { connected: boolean; status: string; discordConnected: boolean } => {
  postNative({ type: "PING" });
  return getNativeStatus();
};

export const reconnectNative = (): { connected: boolean; status: string; discordConnected: boolean } => {
  if (nativePort && (connected || connecting)) {
    postNative({ type: "PING" });
    return getNativeStatus();
  }

  if (nativePort) {
    try {
      nativePort.disconnect();
    } catch {
      // Ignore stale ports.
    }
  }

  nativePort = null;
  connected = false;
  discordConnected = false;
  status = "connecting";
  connectNative();
  return getNativeStatus();
};

export const connectNative = (): void => {
  if (nativePort) return;
  if (connecting) return;

  try {
    connecting = true;
    nativePort = chrome.runtime.connectNative(NATIVE_HOST);
    status = "connecting";
  } catch (error) {
    nativePort = null;
    connecting = false;
    connected = false;
    status = error instanceof Error ? error.message : "native host unavailable";
    return;
  }

  nativePort.onMessage.addListener((message: NativeResponse) => {
    for (const listener of responseListeners) listener(message);

    if (message.type === "CONNECTED") {
      connecting = false;
      connected = true;
      status = "connected";
    }

    if (message.type === "PONG") {
      connecting = false;
      connected = message.connected;
      status = message.status;


      discordConnected = Boolean(message.discordConnected);
      if (discordConnected) {
        void setNativeSeenConnectedOnce(true);
      }
      if (message.profile) {
        void setNativeProfile(message.profile);
      }
    }

    if (message.type === "ERROR") {
      connecting = false;
      status = message.error;
    }
  });

  nativePort.onDisconnect.addListener(() => {
    connecting = false;
    connected = false;
    discordConnected = false;
    status = chrome.runtime.lastError?.message ?? "native disconnected";
    nativePort = null;
  });

  postNative({ type: "PING" });
};

export const postNative = (message: NativeMessage): boolean => {
  connectNative();
  if (!nativePort) return false;

  try {
    nativePort.postMessage(message);
    return true;
  } catch (error) {
    connecting = false;
    connected = false;
    status = error instanceof Error ? error.message : "native post failed";
    nativePort = null;
    return false;
  }
};
