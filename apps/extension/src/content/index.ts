import { EXT_WEB_SOURCE } from "../shared/constants";
import type { WebMessage } from "../shared/types";

const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";

const sendRuntimeMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return null;
  }
};

const broadcastDetected = (): void => {
  let count = 0;
  const interval = window.setInterval(() => {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*");
    count += 1;
    if (count >= 10) window.clearInterval(interval);
  }, 300);
};

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (event.data?.source === EXT_WEB_SOURCE && event.data.type === "PING") {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*");
  }
});

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (event.data?.source !== EXT_WEB_SOURCE || event.data.type === "PING") return;

  sendRuntimeMessage({
      source: "PRESENCES_CONTENT",
      type: event.data.type,
      payload: event.data.payload,
    })
    .then((response) => {
      if (!event.data.messageId) return;
      window.postMessage(
        {
          source: EXT_WEB_SOURCE,
          type: event.data.type === "GET_INSTALLED" ? "INSTALLED_PRESENCES" : `${event.data.type}_RESULT`,
          payload: response,
          messageId: event.data.messageId,
        },
        "*",
      );
    });
});

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  if (event.data?.source !== USER_SCRIPT_MESSAGE_SOURCE) return;

  void sendRuntimeMessage({
    source: USER_SCRIPT_MESSAGE_SOURCE,
    type: event.data.type,
    payload: event.data.payload,
  });
});

broadcastDetected();
