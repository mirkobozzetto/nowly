import { NATIVE_HOST } from "../shared/constants";
import type { NativeMessage, NativeResponse, PresenceData, PresencePayload } from "../shared/types";

let nativePort: chrome.runtime.Port | null = null;
let connected = false;
let status = "not connected";

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

export const getNativeStatus = () => ({ connected, status });

export const refreshNativeStatus = (): { connected: boolean; status: string } => {
  postNative({ type: "PING" });
  return getNativeStatus();
};

export const connectNative = (): void => {
  if (nativePort) return;

  try {
    nativePort = chrome.runtime.connectNative(NATIVE_HOST);
    status = "connecting";
  } catch (error) {
    nativePort = null;
    connected = false;
    status = error instanceof Error ? error.message : "native host unavailable";
    return;
  }

  nativePort.onMessage.addListener((message: NativeResponse) => {
    if (message.type === "CONNECTED") {
      connected = true;
      status = "connected";
    }

    if (message.type === "PONG") {
      connected = message.connected;
      status = message.status;
    }

    if (message.type === "ERROR") {
      status = message.error;
    }
  });

  nativePort.onDisconnect.addListener(() => {
    connected = false;
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
    connected = false;
    status = error instanceof Error ? error.message : "native post failed";
    nativePort = null;
    return false;
  }
};