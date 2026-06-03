import { WEB_BASE_URL, API_BASE_URL } from "../shared/constants";
import type { ExtensionMessage, ExtensionSettings, InstalledPresences, PresenceData, PresenceDebug, PresenceRelease, StoredPresence } from "../shared/types";
import { connectNative, mapPresenceData, onNativeResponse, postNative, reconnectNative, refreshNativeStatus } from "./native";
import { createPresenceRuntime, USER_SCRIPT_MESSAGE_SOURCE } from "./presence-runtime";
import { verifyPresenceRelease } from "./release-security";
import { getCurrentActivity, getDebug, getPresenceSettings, getPresences, getSettings, setCurrentActivity, setDebug, setPresences, setPresenceSettings, setSettings } from "./storage";

let customApiUrl: string | undefined;

const getEffectiveApiUrl = (): string => customApiUrl?.replace(/\/$/, "") || API_BASE_URL;
const getEffectiveWebUrl = (): string => WEB_BASE_URL;

const updateContentScriptsOrigin = async (): Promise<void> => {
  const origin = new URL(getEffectiveWebUrl()).origin;
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id!, { type: "UPDATE_MARKETPLACE_ORIGIN", origin }).catch(() => {});
  }
};

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

type ChromeWithSidePanel = typeof chrome & {
  sidePanel?: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  };
};

const enableSidePanelAction = (): void => {
  const sidePanel = (chrome as ChromeWithSidePanel).sidePanel;
  if (!sidePanel) return;

  void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Some Chromium builds expose sidePanel without action-click behavior.
  });
};

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

const visiblePresences = (presences: InstalledPresences): InstalledPresences =>
  Object.fromEntries(
    Object.entries(presences).filter(([, presence]) => (
      presence?.metadata?.slug
      && presence.metadata.name
      && Array.isArray(presence.metadata.url)
    )),
  ) as InstalledPresences;

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
    if (host === "*" || host === "*.*" || host === "<all_urls>") continue;
    patterns.add(`*://${host}/*`);

    if (!host.startsWith("*.") && !host.startsWith("*.")) {
      patterns.add(`*://*.${host}/*`);
    }
  }

  return [...patterns];
};

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

const getPresenceRuntime = async (slug: string, name: string, bundle: string): Promise<string> => {
  const allSettings = await getPresenceSettings();
  const presenceSettings = allSettings[slug] ?? {};
  return createPresenceRuntime(slug, name, bundle, presenceSettings, getEffectiveApiUrl());
};

const registerPresenceScript = async (slug: string, presence: StoredPresence): Promise<{ ok: boolean; error?: string }> => {
  const userScripts = (chrome as ChromeWithUserScripts).userScripts;
  if (!userScripts) {
    return { ok: false, error: "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension." };
  }

  if (!presence.release) return { ok: false, error: "presence release is not signed" };
  const verified = await verifyPresenceRelease(presence.release, slug);
  if (!verified.ok) return verified;

  const metadata = presence.release.metadata;
  const matches = toMatchPatterns(metadata.url);
  if (!matches.length) return { ok: false, error: "presence has no valid URL patterns" };
  if (!presence.release.bundle?.trim()) return { ok: false, error: "presence has no bundle" };

  try {
    await unregisterPresenceScript(slug);
    const code = await getPresenceRuntime(slug, metadata.name, presence.release.bundle);
    const script: RegisteredUserScript = {
      id: userScriptId(slug),
      matches,
      js: [{ code }],
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

const broadcastPresencesChanged = (): void => {
  chrome.runtime.sendMessage({ source: "PRESENCES_BACKGROUND", type: "PRESENCES_CHANGED" }).catch(() => {
    // No extension pages (popup/sidepanel) are open — that's fine.
  });
};

const installPresence = async (payload: unknown): Promise<{ ok: boolean; error?: string }> => {
  const presence = payload as { slug: string; release: PresenceRelease };
  const verified = await verifyPresenceRelease(presence.release, presence.slug);
  if (!verified.ok) return verified;

  const presences = await getPresences();

  presences[presence.slug] = {
    metadata: presence.release.metadata,
    release: presence.release,
    enabled: true,
    installedAt: presences[presence.slug]?.installedAt ?? Date.now(),
    updatedAt: Date.now(),
  };

  await setPresences(presences);
  broadcastPresencesChanged();
  return registerPresenceScript(presence.slug, presences[presence.slug]);
};

const clampText = (value: string | undefined, maxLength: number): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const normalizeTimestamp = (value: number | undefined): number | undefined => {
  if (!Number.isFinite(value)) return undefined;
  if (!value || value <= 0) return undefined;
  return Math.floor(value > 10_000_000_000 ? value / 1000 : value);
};

const normalizeImage = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith("http://")) return undefined;
  if (value.startsWith("https://")) return value;
  if (/^[a-z0-9_-]{1,64}$/i.test(value)) return value;
  return undefined;
};

const normalizeActivity = (activity: PresenceData, fallbackName: string): PresenceData => {
  const allowedTypes = new Set([0, 1, 2, 3, 5]);
  return {
    name: clampText(activity.name, 128) ?? fallbackName,
    details: clampText(activity.details, 128),
    state: clampText(activity.state, 128),
    startTimestamp: normalizeTimestamp(activity.startTimestamp),
    endTimestamp: normalizeTimestamp(activity.endTimestamp),
    largeImageKey: normalizeImage(activity.largeImageKey),
    largeImageText: clampText(activity.largeImageText, 128),
    smallImageKey: normalizeImage(activity.smallImageKey),
    smallImageText: clampText(activity.smallImageText, 128),
    type: allowedTypes.has(activity.type ?? 0) ? activity.type : 0,
    buttons: activity.buttons
      ?.filter((button) => button.url.startsWith("https://"))
      .slice(0, 2)
      .map((button) => ({
        label: clampText(button.label, 32) ?? "Open",
        url: button.url,
      })),
  };
};

const handleActivityUpdate = async (
  slug: string,
  activity: PresenceData,
  tabId?: number,
): Promise<{ ok: boolean }> => {
  const presences = await getPresences();
  const stored = presences[slug];
  if (!stored?.release) return { ok: false };

  const verified = await verifyPresenceRelease(stored.release, slug);
  if (!verified.ok) {
    await setDebug({
      stage: "security",
      message: `[${slug}] ${verified.error ?? "release verification failed"}`,
      updatedAt: Date.now(),
    });
    return { ok: false };
  }

  const appName = activity.appName ?? stored.release.metadata.name;
  const normalizedActivity = normalizeActivity(activity, appName);
  const presence = mapPresenceData(normalizedActivity);

  if (tabId) activeTabId = tabId;
  addActiveSlug(slug);

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
  activeSlugs.clear();
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
      getPresences().then((presences) => respond(sendResponse, visiblePresences(presences)));
      return true;

    case "GET_NATIVE_STATUS":
      respond(sendResponse, refreshNativeStatus());
      return false;

    case "GET_USER_SCRIPTS_STATUS":
      respond(sendResponse, {
        enabled: Boolean((chrome as unknown as { userScripts?: unknown }).userScripts),
        requiresUserToggle: true,
        reason: (chrome as unknown as { userScripts?: unknown }).userScripts
          ? undefined
          : "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension.",
      });
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
      installPresence(message.payload)
        .then((result) => respond(sendResponse, result))
        .catch((error) => respond(sendResponse, {
          ok: false,
          error: error instanceof Error ? error.message : "presence install failed",
        }));
      return true;

    case "UNINSTALL_PRESENCE":
      getPresences().then(async (presences) => {
        const { slug } = message.payload as { slug: string };
        delete presences[slug];

        await setPresences(presences);
        broadcastPresencesChanged();
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

    case "CHECK_UPDATES":
      getPresences().then(async (presences) => {
        const updates: Record<string, string> = {};
        const slugs = Object.keys(presences);
        const results = await Promise.allSettled(
          slugs.map((slug) =>
            fetch(`${getEffectiveApiUrl()}/presences/${slug}`)
              .then((r) => r.json() as Promise<{ version: string }>)
              .then((data) => ({ slug, latestVersion: data.version }))
          )
        );
        for (const result of results) {
          if (result.status === "fulfilled") {
            const { slug, latestVersion } = result.value;
            const installed = presences[slug].release?.metadata?.version;
            if (installed && latestVersion !== installed) {
              updates[slug] = latestVersion;
            }
          }
        }
        respond(sendResponse, updates);
      });
      return true;

    case "GET_SETTINGS":
      getSettings().then((settings) => respond(sendResponse, settings));
      return true;

    case "SET_SETTINGS":
      setSettings(message.payload as Partial<ExtensionSettings>).then((settings) => {
        customApiUrl = settings.customApiBaseUrl;
        respond(sendResponse, settings);
      });
      return true;

    case "GET_PRESENCE_SETTINGS":
      getPresenceSettings().then((settings) => respond(sendResponse, settings));
      return true;

    case "SET_PRESENCE_SETTINGS": {
      const { slug, partial } = message.payload as { slug: string; partial: Record<string, unknown> };
      void setPresenceSettings(slug, partial).then((settings) => {
        respond(sendResponse, settings);
        getPresences().then((presences) => {
          const stored = presences[slug];
          if (stored?.enabled && stored.release?.bundle) {
            void registerPresenceScript(slug, stored);
          }
        });
      });
      return true;
    }

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

const activeSlugs = new Set<string>();

const addActiveSlug = (slug: string) => activeSlugs.add(slug);
const removeActiveSlug = (slug: string) => activeSlugs.delete(slug);

chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });
chrome.alarms.create("api-heartbeat", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
  if (alarm.name === "api-heartbeat" && activeSlugs.size > 0) {
    const slugs = [...activeSlugs];
    fetch(`${getEffectiveApiUrl()}/presences/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presences: slugs }),
    }).catch(() => {});
  }
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

const initializeCustomApiUrl = async (): Promise<void> => {
  const settings = await getSettings();
  customApiUrl = settings.customApiBaseUrl;
};

chrome.runtime.onStartup.addListener(() => {
  enableSidePanelAction();
  void handleClearActivity();
  connectNative();
  void initializeCustomApiUrl();
  getPresences().then((presences) => void syncPresenceScripts(presences));
});

chrome.runtime.onInstalled.addListener(() => {
  enableSidePanelAction();
  void handleClearActivity();
  connectNative();
  void initializeCustomApiUrl();
  getPresences().then((presences) => void syncPresenceScripts(presences));
});

enableSidePanelAction();
void handleClearActivity();
connectNative();
void initializeCustomApiUrl();
getPresences().then((presences) => void syncPresenceScripts(presences));
