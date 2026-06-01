import type { ExtensionMessage, InstalledPresences, PresenceData, PresenceDebug, StoredPresence } from "../shared/types";
import { connectNative, mapPresenceData, onNativeResponse, postNative, reconnectNative, refreshNativeStatus } from "./native";
import { getCurrentActivity, getDebug, getPresences, setCurrentActivity, setDebug, setPresences } from "./storage";

const respond = <T>(sendResponse: (response?: T) => void, value: T): void => sendResponse(value);

let activeTabId: number | null = null;

type UserScriptSource = {
  code?: string;
  file?: string;
};

type RegisteredUserScript = {
  id: string;
  matches: string[];
  js: UserScriptSource[];
  runAt?: "document_start" | "document_end" | "document_idle";
  allFrames?: boolean;
  world?: "USER_SCRIPT" | "MAIN";
};

type ChromeWithUserScripts = typeof chrome & {
  userScripts?: {
    getScripts(filter?: { ids?: string[] }): Promise<RegisteredUserScript[]>;
    register(scripts: RegisteredUserScript[]): Promise<void>;
    unregister(filter?: { ids?: string[] }): Promise<void>;
  };
};

const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";

onNativeResponse((message) => {
  if (message.type === "ERROR") {
    void setDebug({
      stage: "native-error",
      message: message.error,
      updatedAt: Date.now(),
    });
    return;
  }

  if (message.type === "OK") {
    void setDebug({
      stage: "native",
      message: "discord activity accepted",
      updatedAt: Date.now(),
    });
  }
});

const userScriptId = (slug: string): string => `nowly-presence-${slug}`;

const toMatchPatterns = (urls: string[]): string[] => {
  const patterns = new Set<string>();

  for (const rawUrl of urls) {
    const raw = rawUrl.trim();
    if (!raw) continue;

    if (raw.includes("://")) {
      const withPath = raw.endsWith("/*") || raw.includes("/", raw.indexOf("://") + 3)
        ? raw
        : `${raw}/*`;
      patterns.add(withPath);
      continue;
    }

    const host = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    patterns.add(`*://${host}/*`);

    if (!host.startsWith("*.") && !host.startsWith("*.")) {
      patterns.add(`*://*.${host}/*`);
    }
  }

  return [...patterns];
};

const presenceRuntime = (slug: string, name: string, bundle: string): string => `
(() => {
  "use strict";

  const NOWLY_SLUG = ${JSON.stringify(slug)};
  const NOWLY_NAME = ${JSON.stringify(name)};
  const NOWLY_SOURCE = ${JSON.stringify(USER_SCRIPT_MESSAGE_SOURCE)};
  const listeners = new Map();
  const instances = [];
  const storage = new Map();

  const post = (type, payload = {}) => {
    window.postMessage({
      source: NOWLY_SOURCE,
      type,
      payload: { slug: NOWLY_SLUG, ...payload },
    }, "*");
  };

  class Presence {
    constructor(options = {}) {
      this.options = options;
      instances.push(this);
    }

    on(eventName, listener) {
      const eventListeners = listeners.get(this) ?? new Map();
      const callbacks = eventListeners.get(eventName) ?? [];
      callbacks.push(listener);
      eventListeners.set(eventName, callbacks);
      listeners.set(this, eventListeners);
    }

    setActivity(data) {
      if (!data) {
        this.clearActivity();
        return Promise.resolve();
      }

      post("ACTIVITY_UPDATE", { activity: { name: NOWLY_NAME, ...data } });
      return Promise.resolve();
    }

    clearActivity() {
      post("CLEAR_ACTIVITY");
    }

    getStrings(strings) {
      return Promise.resolve(strings);
    }

    getSetting() {
      return Promise.resolve(undefined);
    }

    info(message) {
      post("DEBUG", { stage: "presence", message: String(message) });
    }

    error(message) {
      post("DEBUG", { stage: "presence-error", message: String(message) });
    }
  }

  globalThis.Presence = Presence;

  const ctx = {
    setActivity(data) {
      post("ACTIVITY_UPDATE", { activity: { name: NOWLY_NAME, ...data } });
    },
    clearActivity() {
      post("CLEAR_ACTIVITY");
    },
    storage,
  };

  try {
    ${bundle}

    const factory = typeof __PRESENCE__ !== "undefined" && __PRESENCE__?.default
      ? __PRESENCE__.default
      : undefined;

    factory?.init?.(ctx);

    const tick = () => {
      try {
        factory?.tick?.(ctx);

        for (const instance of instances) {
          const eventListeners = listeners.get(instance);
          const callbacks = eventListeners?.get("UpdateData") ?? [];
          for (const callback of callbacks) {
            Promise.resolve(callback()).catch((error) => {
              post("DEBUG", {
                stage: "presence-error",
                message: error instanceof Error ? error.message : "UpdateData failed",
              });
            });
          }
        }
      } catch (error) {
        post("DEBUG", {
          stage: "presence-error",
          message: error instanceof Error ? error.message : "presence tick failed",
        });
      }
    };

    tick();
    const timer = setInterval(tick, 5000);
    window.addEventListener("pagehide", () => {
      clearInterval(timer);
      factory?.destroy?.();
      post("CLEAR_ACTIVITY");
    });
  } catch (error) {
    post("DEBUG", {
      stage: "presence-error",
      message: error instanceof Error ? error.message : "presence bundle failed",
    });
  }
})();
`;

const unregisterPresenceScript = async (slug: string): Promise<void> => {
  const userScripts = (chrome as ChromeWithUserScripts).userScripts;
  if (!userScripts) return;
  const id = userScriptId(slug);

  try {
    const scripts = await userScripts.getScripts({ ids: [id] });
    if (!scripts.length) return;
    await userScripts.unregister({ ids: [id] });
  } catch {
    // The script may not be registered yet.
  }
};

const registerPresenceScript = async (slug: string, presence: StoredPresence): Promise<{ ok: boolean; error?: string }> => {
  const userScripts = (chrome as ChromeWithUserScripts).userScripts;
  if (!userScripts) {
    return { ok: false, error: "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension." };
  }

  const matches = toMatchPatterns(presence.metadata.url);
  if (!matches.length) return { ok: false, error: "presence has no valid URL patterns" };
  if (!presence.bundle?.trim()) return { ok: false, error: "presence has no bundle" };

  try {
    await unregisterPresenceScript(slug);
    const script: RegisteredUserScript = {
      id: userScriptId(slug),
      matches,
      js: [{ code: presenceRuntime(slug, presence.metadata.name, presence.bundle) }],
      runAt: "document_idle",
      allFrames: false,
      world: "USER_SCRIPT",
    };

    try {
      await userScripts.register([script]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("duplicate")) throw error;
      await userScripts.unregister({ ids: [script.id] });
      await userScripts.register([script]);
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed to register presence user script",
    };
  }
};

const syncPresenceScripts = async (presences: InstalledPresences): Promise<void> => {
  for (const [slug, presence] of Object.entries(presences)) {
    if (!presence.enabled) {
      await unregisterPresenceScript(slug);
      continue;
    }

    const result = await registerPresenceScript(slug, presence);
    if (!result.ok) {
      await setDebug({
        stage: "userScripts",
        message: `[${slug}] ${result.error ?? "failed to register presence"}`,
        updatedAt: Date.now(),
      });
    }
  }
};

const installPresence = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  const presence = payload as { slug: string; metadata: StoredPresence["metadata"]; bundle: string };
  const presences = await getPresences();

  presences[presence.slug] = {
    metadata: presence.metadata,
    bundle: presence.bundle,
    enabled: true,
    installedAt: presences[presence.slug]?.installedAt ?? Date.now(),
    updatedAt: Date.now(),
  };

  await setPresences(presences);
  return registerPresenceScript(presence.slug, presences[presence.slug]);
};

const handleActivityUpdate = async (
  slug: string,
  activity: PresenceData,
  tabId?: number,
): Promise<{ ok: boolean }> => {
  const presence = mapPresenceData(activity);

  if (tabId) activeTabId = tabId;

  postNative({ type: "SET_ACTIVITY", presence });

  await Promise.all([
    setCurrentActivity({ slug, presence, updatedAt: Date.now() }),
    setDebug({
      stage: "activity",
      message: presence.details ?? "activity received",
      updatedAt: Date.now(),
    }),
  ]);

  return { ok: true };
};

const handleClearActivity = async (): Promise<{ ok: boolean }> => {
  activeTabId = null;
  postNative({ type: "CLEAR_ACTIVITY" });

  await Promise.all([
    setCurrentActivity(null),
    setDebug({ stage: "clear", message: "activity cleared", updatedAt: Date.now() }),
  ]);

  return { ok: true };
};

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false;

  switch (message.type) {
    case "GET_PRESENCES":
    case "GET_INSTALLED":
      getPresences().then((presences) => respond(sendResponse, presences));
      return true;

    case "GET_NATIVE_STATUS":
      respond(sendResponse, refreshNativeStatus());
      return false;

    case "CONNECT_NATIVE":
      respond(sendResponse, reconnectNative());
      return false;

    case "GET_CURRENT_ACTIVITY":
      getCurrentActivity().then((activity) => respond(sendResponse, activity));
      return true;

    case "GET_DEBUG":
      getDebug().then((debug) => respond(sendResponse, debug));
      return true;

    case "INSTALL_PRESENCE":
    case "UPDATE_PRESENCE":
      installPresence(message.payload).then((result) => respond(sendResponse, result));
      return true;

    case "UNINSTALL_PRESENCE":
      getPresences().then(async (presences) => {
        const { slug } = message.payload as { slug: string };
        delete presences[slug];

        await setPresences(presences);
        await unregisterPresenceScript(slug);
        await handleClearActivity();
        respond(sendResponse, { ok: true });
      });
      return true;

    case "TOGGLE_PRESENCE":
      getPresences().then(async (presences) => {
        const { slug, enabled } = message.payload as { slug: string; enabled: boolean };

        if (!presences[slug]) {
          respond(sendResponse, { ok: false });
          return;
        }

        presences[slug].enabled = enabled;
        await setPresences(presences);
        if (enabled) {
          const result = await registerPresenceScript(slug, presences[slug]);
          respond(sendResponse, result);
          return;
        }

        await unregisterPresenceScript(slug);
        respond(sendResponse, { ok: true });
      });
      return true;

    case "ACTIVITY_UPDATE": {
      const { slug, activity } = message.payload as { slug: string; activity: PresenceData };
      handleActivityUpdate(slug, activity, sender.tab?.id).then((result) => respond(sendResponse, result));
      return true;
    }

    case "CLEAR_ACTIVITY":
      handleClearActivity().then((result) => respond(sendResponse, result));
      return true;

    case "DEBUG":
      setDebug(message.payload as PresenceDebug).then(() => respond(sendResponse, { ok: true }));
      return true;

    default:
      respond(sendResponse, { ok: false });
      return false;
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.source !== USER_SCRIPT_MESSAGE_SOURCE) return false;

  const payload = message.payload as { slug?: string; activity?: PresenceData; stage?: string; message?: string } | undefined;
  const slug = payload?.slug;
  if (!slug) return false;

  if (message.type === "ACTIVITY_UPDATE" && payload.activity) {
    void handleActivityUpdate(slug, payload.activity, sender.tab?.id);
  }

  if (message.type === "CLEAR_ACTIVITY") {
    void handleClearActivity();
  }

  if (message.type === "DEBUG") {
    void setDebug({
      stage: payload.stage ?? "presence",
      message: `[${slug}] ${payload.message ?? "debug"}`,
      url: sender.tab?.url,
      updatedAt: Date.now(),
    });
  }

  return false;
});

chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null;
    postNative({ type: "CLEAR_ACTIVITY" });

    Promise.all([
      setCurrentActivity(null),
      setDebug({ stage: "clear", message: "activity cleared (tab closed)", updatedAt: Date.now() }),
    ]);
  }
});

chrome.runtime.onStartup.addListener(() => {
  connectNative();
  getPresences().then((presences) => void syncPresenceScripts(presences));
});

chrome.runtime.onInstalled.addListener(() => {
  connectNative();
  getPresences().then((presences) => void syncPresenceScripts(presences));
});

connectNative();
getPresences().then((presences) => void syncPresenceScripts(presences));
