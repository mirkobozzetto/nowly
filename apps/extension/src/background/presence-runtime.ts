export const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";

export const createPresenceRuntime = (slug: string, name: string, bundle: string): string => `
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
    constructor() {
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
