import { EXT_WEB_SOURCE, WEB_BASE_URL } from "../shared/constants";
import type { WebMessage } from "../shared/types";

const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";
const IS_UNPACKED = !chrome.runtime.getManifest().update_url;
const RATINGS_KEY = "userRatings";
let MARKETPLACE_ORIGIN = new URL(WEB_BASE_URL).origin;
const WEB_MESSAGE_TYPES = new Set([
  "INSTALL_PRESENCE",
  "UPDATE_PRESENCE",
  "UNINSTALL_PRESENCE",
  "GET_INSTALLED",
  "SAVE_USER_RATING",
  "GET_USER_RATINGS",
]);

const sendRuntimeMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return null;
  }
};

const getUserRatings = async (): Promise<Record<string, number>> => {
  const result = await chrome.storage.local.get(RATINGS_KEY);
  return (result[RATINGS_KEY] ?? {}) as Record<string, number>;
};

const saveUserRating = async (slug: string, rating: number): Promise<void> => {
  const ratings = await getUserRatings();
  ratings[slug] = rating;
  await chrome.storage.local.set({ [RATINGS_KEY]: ratings });
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
  if (!IS_UNPACKED && event.origin !== MARKETPLACE_ORIGIN) return;

  if (event.data?.source === EXT_WEB_SOURCE && event.data.type === "PING") {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*");
  }
});

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (!IS_UNPACKED && event.origin !== MARKETPLACE_ORIGIN) return;
  if (event.data?.source !== EXT_WEB_SOURCE || event.data.type === "PING") return;
  if (!WEB_MESSAGE_TYPES.has(event.data.type)) return;

  const msg = event.data;
  if (!msg.messageId) return;

  if (msg.type === "SAVE_USER_RATING") {
    const { slug, rating } = (msg.payload ?? {}) as { slug?: string; rating?: number };
    if (slug && typeof rating === "number") {
      saveUserRating(slug, rating);
    }
    window.postMessage(
      { source: EXT_WEB_SOURCE, type: "SAVE_USER_RATING_RESULT", payload: { ok: true }, messageId: msg.messageId },
      "*",
    );
    return;
  }

  if (msg.type === "GET_USER_RATINGS") {
    getUserRatings().then((ratings) => {
      window.postMessage(
        { source: EXT_WEB_SOURCE, type: "USER_RATINGS", payload: ratings, messageId: msg.messageId },
        "*",
      );
    });
    return;
  }

  sendRuntimeMessage({
      source: "PRESENCES_CONTENT",
      type: msg.type,
      payload: msg.payload,
    })
    .then((response) => {
      window.postMessage(
        {
          source: EXT_WEB_SOURCE,
          type: msg.type === "GET_INSTALLED" ? "INSTALLED_PRESENCES" : `${msg.type}_RESULT`,
          payload: response ?? { ok: false, error: "background unavailable" },
          messageId: msg.messageId,
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

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "UPDATE_MARKETPLACE_ORIGIN" && typeof message.origin === "string") {
    MARKETPLACE_ORIGIN = message.origin;
  }
});

broadcastDetected();
