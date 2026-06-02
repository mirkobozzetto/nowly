export const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";

export const createPresenceRuntime = (
  slug: string,
  name: string,
  bundle: string,
  settings: Record<string, unknown> = {},
  apiBaseUrl = "https://api.nowly.me"
): string => `
(() => {
  "use strict";

  const NOWLY_SLUG = ${JSON.stringify(slug)};
  const NOWLY_NAME = ${JSON.stringify(name)};
  const NOWLY_SOURCE = ${JSON.stringify(USER_SCRIPT_MESSAGE_SOURCE)};
  const NOWLY_SETTINGS = ${JSON.stringify(settings)};
  const NOWLY_ASSETS_BASE = ${JSON.stringify(`${apiBaseUrl}/presences/${slug}/assets`)};
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
    constructor() {
      instances.push(this);
    }

    static Settings(definitions) {
      if (typeof __PRESENCE_SETTINGS__ !== "undefined") {
        __PRESENCE_SETTINGS__ = definitions;
      }
      if (typeof definitions !== "object" || definitions === null) return {};
      const defaults = {};
      for (const [key, value] of Object.entries(definitions)) {
        if (typeof value === "object" && value !== null && "default" in value) {
          defaults[key] = value.default;
        } else {
          defaults[key] = value;
        }
      }
      return defaults;
    }

    static Assets(assets) {
      if (typeof assets !== "object" || assets === null) return {};
      const resolved = {};
      for (const [key, value] of Object.entries(assets)) {
        const cleanPath = String(value).replace(/^\//, "");
        resolved[key] = NOWLY_ASSETS_BASE + "/" + cleanPath;
      }
      return resolved;
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
  const Assets = globalThis.Assets = {
    Logo: NOWLY_ASSETS_BASE + "/logo",
    Icon: NOWLY_ASSETS_BASE + "/icon",
    Thumbnail: NOWLY_ASSETS_BASE + "/thumbnail",
  };

  const ctx = {
    setActivity(data) {
      post("ACTIVITY_UPDATE", { activity: { name: NOWLY_NAME, ...data } });
    },
    clearActivity() {
      post("CLEAR_ACTIVITY");
    },
    storage,
    settings: NOWLY_SETTINGS,
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
            Promise.resolve(callback(ctx)).catch((error) => {
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