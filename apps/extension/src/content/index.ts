import { EXT_WEB_SOURCE, WEB_BASE_URL } from "../shared/constants";
import type { InstalledPresences, PresenceData, WebMessage } from "../shared/types";

const matchUrl = (hostname: string, patterns: string[]): boolean =>
  patterns.some((pattern) => {
    const escaped = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
    return new RegExp(`^(.*\\.)?${escaped}$`, "i").test(hostname);
  });

const matchRegExp = (url: string, pattern: string): boolean => {
  try {
    return new RegExp(pattern).test(url);
  } catch {
    return false;
  }
};

const findMatchingPresence = (
  presences: InstalledPresences,
  hostname: string,
  url: string,
): string | null => {
  for (const [slug, presence] of Object.entries(presences)) {
    if (!presence.enabled) continue;
    if (matchUrl(hostname, presence.metadata.url)) return presence.metadata.slug ?? slug;
    if (presence.metadata.regExp && matchRegExp(url, presence.metadata.regExp)) {
      return presence.metadata.slug ?? slug;
    }
  }
  return null;
};

let activePresenceSlug: string | null = null;
let lastHref = window.location.href;
let tickTimer: ReturnType<typeof setInterval> | null = null;

const sendRuntimeMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return null;
  }
};

const debug = (stage: string, message: string): void => {
  void sendRuntimeMessage({
    source: "PRESENCES_CONTENT",
    type: "DEBUG",
    payload: {
      stage,
      message,
      url: window.location.href,
      updatedAt: Date.now(),
    },
  });
};

const i18n = (key: string, fallback: string): string => {
  try {
    return chrome.i18n.getMessage(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const bridge = {
  setActivity: (data: PresenceData) => {
    sendRuntimeMessage({
      source: "PRESENCES_CONTENT",
      type: "ACTIVITY_UPDATE",
      payload: { slug: window.location.hostname, activity: data },
    });
  },

  clearActivity: () => {
    sendRuntimeMessage({
      source: "PRESENCES_CONTENT",
      type: "CLEAR_ACTIVITY",
      payload: { slug: window.location.hostname },
    });
  },
};

const findVideo = (): HTMLVideoElement | null =>
  document.querySelector<HTMLVideoElement>(".video-stream")
  || document.querySelector<HTMLVideoElement>("video.html5-main-video")
  || document.querySelector<HTMLVideoElement>("#movie_player video")
  || document.querySelector<HTMLVideoElement>("video");

const findTitle = (): string | null =>
  document.querySelector<HTMLElement>("h1.ytd-watch-metadata yt-formatted-string")
  ?.textContent?.trim() ?? null;

const findUploader = (): string | null =>
  document.querySelector<HTMLElement>("#owner #channel-name a")
  ?.textContent?.trim() ?? null;

const tickYoutube = (): void => {
  const video = findVideo();
  if (!video) return;

  const title = findTitle() || video.getAttribute("title") || document.title;
  const uploader = findUploader() || "YouTube";
  const duration = video.duration;
  const currentTime = video.currentTime;
  const paused = video.paused;

  const now = Math.floor(Date.now() / 1000);
  const videoId = new URLSearchParams(window.location.search).get("v");

  bridge.setActivity({
    name: "YouTube",
    details: title,
    state: uploader,
    startTimestamp: paused ? undefined : now - Math.floor(currentTime),
    endTimestamp: paused || !duration ? undefined : now + Math.floor(duration - currentTime),
    largeImageKey: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
    largeImageText: title,
    smallImageKey: paused ? "pause" : "play",
    smallImageText: paused ? i18n("paused", "Paused") : i18n("playing", "Playing"),
    type: 3,
  });
};

const startPresence = (slug: string): void => {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  debug("presence", `starting ${slug}`);

  if (window.location.hostname === "www.youtube.com" || window.location.hostname === "youtube.com") {
    tickYoutube();
    tickTimer = setInterval(tickYoutube, 5000);
    activePresenceSlug = slug;
    lastHref = window.location.href;
    debug("presence", `started ${slug}`);
  }
};

const fetchBundle = async (slug: string): Promise<string | null> => {
  try {
    const response = await fetch(`${WEB_BASE_URL}/api/p/${slug}/bundle`);
    if (!response.ok) return null;
    return await response.text();
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

const init = async (): Promise<void> => {
  debug("init", `checking ${window.location.hostname}`);
  broadcastDetected();

  const result = await chrome.storage.local.get("presences");
  const presences = (result.presences ?? {}) as InstalledPresences;
  debug("storage", `${Object.keys(presences).length} installed presence(s)`);

  const slug = findMatchingPresence(presences, window.location.hostname, window.location.href);
  if (!slug) {
    debug("match", "no matching presence");
    return;
  }

  if (slug === activePresenceSlug && lastHref === window.location.href) return;

  debug("match", `matched ${slug}`);

  startPresence(slug);
};

const scheduleInit = (): void => {
  window.setTimeout(() => void init(), 250);
  window.setTimeout(() => void init(), 1500);
  window.setTimeout(() => void init(), 4000);
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

window.addEventListener("yt-navigate-finish", () => {
  activePresenceSlug = null;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  scheduleInit();
});

window.addEventListener("popstate", () => {
  activePresenceSlug = null;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  scheduleInit();
});

scheduleInit();