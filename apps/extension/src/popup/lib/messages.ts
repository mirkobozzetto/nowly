import type { ExtensionMessageType } from "../../shared/types";

export type NativeStatus = {
  connected: boolean;
  status: string;
};

export const sendMessage = <T,>(type: ExtensionMessageType, payload?: unknown): Promise<T> =>
  chrome.runtime.sendMessage({ source: "PRESENCES_POPUP", type, payload });
