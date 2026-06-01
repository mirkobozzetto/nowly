import type { ExtensionMessage, PresenceData, PresenceDebug, StoredPresence } from "../shared/types";
import { connectNative, mapPresenceData, postNative, refreshNativeStatus } from "./native";
import { getCurrentActivity, getDebug, getPresences, setCurrentActivity, setDebug, setPresences } from "./storage";

const respond = <T>(sendResponse: (response?: T) => void, value: T): void => sendResponse(value);

let activeTabId: number | null = null;

const installPresence = async (payload: unknown): Promise<{ ok: boolean }> => {
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
        respond(sendResponse, { ok: true });
      });
      return true;

    case "ACTIVITY_UPDATE": {
      const { slug, activity } = message.payload as { slug: string; activity: PresenceData };
      const presence = mapPresenceData(activity);

      if (sender.tab?.id) activeTabId = sender.tab.id;

      postNative({ type: "SET_ACTIVITY", presence });

      Promise.all([
        setCurrentActivity({ slug, presence, updatedAt: Date.now() }),
        setDebug({
          stage: "activity",
          message: presence.details ?? "activity received",
          updatedAt: Date.now(),
        }),
      ]).then(() => {
        respond(sendResponse, { ok: true });
      });
      return true;
    }

    case "CLEAR_ACTIVITY":
      activeTabId = null;
      postNative({ type: "CLEAR_ACTIVITY" });

      Promise.all([
        setCurrentActivity(null),
        setDebug({ stage: "clear", message: "activity cleared", updatedAt: Date.now() }),
      ]).then(() => respond(sendResponse, { ok: true }));
      return true;

    case "DEBUG":
      setDebug(message.payload as PresenceDebug).then(() => respond(sendResponse, { ok: true }));
      return true;

    default:
      respond(sendResponse, { ok: false });
      return false;
  }
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

chrome.runtime.onStartup.addListener(connectNative);
chrome.runtime.onInstalled.addListener(connectNative);

connectNative();