import { WEB_BASE_URL, API_BASE_URL, CDN_BASE_URL } from "@/shared/constants";
import type { ExtensionMessage, ExtensionSettings, InstalledPresences, PresenceData, PresenceDebug, PresenceRelease, StoredPresence } from "@/shared/types";
import { connectNative, mapPresenceData, onNativeResponse, postNative, reconnectNative, refreshNativeStatus } from "./native";
import { createPresenceRuntime, USER_SCRIPT_MESSAGE_SOURCE } from "./presence-runtime";
import { verifyPresenceRelease } from "./release-security";
import { getCurrentActivity, getDebug, getDeviceId, getPresenceSettings, getPresences, getSettings, setCurrentActivity, setDebug, setPresences, setPresenceSettings, setSettings } from "./storage";
import { BUNDLED_PRESENCES } from "@/generated/bundled-presences";

let customApiUrl: string | undefined;
let cachedDeviceId: string | null = null;
let analyticsQueue: Array<{ key: string; slug?: string; version?: string; payload?: Record<string, unknown> }> = [];
const activeSessions = new Map<string, number>();
let lastExtensionOpenTrackedAt = 0;

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

const getActiveDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;
  cachedDeviceId = await getDeviceId();
  return cachedDeviceId;
};

const syncUninstallUrl = async (): Promise<void> => {
  try {
    const deviceId = await getActiveDeviceId();
    chrome.runtime.setUninstallURL(`${WEB_BASE_URL}/uninstall?deviceId=${encodeURIComponent(deviceId)}`);
  } catch {
    // Best effort only.
  }
};

const browserName = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("OPR/")) return "opera";
  return "chromium";
};

const osName = (): string => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac")) return "macos";
  if (platform.includes("linux")) return "linux";
  return "unknown";
};

const syncDeviceState = async (): Promise<void> => {
  const [deviceId, presences, settings] = await Promise.all([
    getActiveDeviceId(),
    getPresences(),
    getSettings(),
  ]);

  await fetch(`${getEffectiveApiUrl()}/devices/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      analyticsConsent: settings.analyticsConsent === true,
      extensionVersion: chrome.runtime.getManifest().version,
      browser: browserName(),
      os: osName(),
      presences: Object.entries(presences).map(([slug, presence]) => ({
        slug,
        version: presence.release?.version ?? presence.metadata?.version ?? undefined,
        enabled: presence.enabled,
        installed: true,
      })),
    }),
  }).catch(() => {});
};

const flushAnalytics = async (): Promise<void> => {
  if (!analyticsQueue.length) return;
  const settings = await getSettings();
  if (settings.analyticsConsent !== true) {
    analyticsQueue = [];
    return;
  }

  const deviceId = await getActiveDeviceId();
  const events = analyticsQueue.splice(0, analyticsQueue.length).map((event) => ({
    ...event,
    deviceId,
    payload: {
      extensionVersion: chrome.runtime.getManifest().version,
      browser: browserName(),
      os: osName(),
      ...(event.payload ?? {}),
    },
  }));

  await fetch(`${getEffectiveApiUrl()}/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  }).catch(() => {
    analyticsQueue.unshift(...events.map(({ deviceId: _deviceId, ...event }) => event));
  });
};

const trackAnalytics = async (
  key: string,
  event: { slug?: string; version?: string; payload?: Record<string, unknown> } = {},
): Promise<void> => {
  const settings = await getSettings();
  if (settings.analyticsConsent !== true) return;
  analyticsQueue.push({ key, ...event });
  if (analyticsQueue.length >= 10) await flushAnalytics();
};

const trackExtensionOpen = (): void => {
  const now = Date.now();
  if (now - lastExtensionOpenTrackedAt < 60_000) return;
  lastExtensionOpenTrackedAt = now;
  void trackAnalytics("extension_open", { payload: { surface: "extension" } });
};

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
    void trackAnalytics("native_heartbeat_failed", { payload: { reason: "native-error" } });
    return;
  }

  if (message.type === "CONNECTED") {
    void trackAnalytics("native_connected", { payload: { nativeVersion: message.version } });
  }

  if (message.type === "PONG") {
    void trackAnalytics(message.connected ? "native_heartbeat_ok" : "native_heartbeat_failed", {
      payload: {
        nativeVersion: message.version,
        reason: message.connected ? undefined : "not-connected",
      },
    });
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
  return createPresenceRuntime(slug, name, bundle, presenceSettings, getEffectiveApiUrl(), CDN_BASE_URL);
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
      runAt: slug === "youtube" ? "document_start" : "document_idle",
      allFrames: false,
      world: slug === "youtube" ? "MAIN" : "USER_SCRIPT",
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
      void trackAnalytics("presence_error", { slug, payload: { stage: "userScripts" } });
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
  const existing = presences[presence.slug];

  presences[presence.slug] = {
    metadata: presence.release.metadata,
    release: presence.release,
    enabled: existing?.enabled ?? true,
    installedAt: existing?.installedAt ?? Date.now(),
    updatedAt: Date.now(),
  };

  await setPresences(presences);
  await syncDeviceState();
  void trackAnalytics(existing ? "presence_update" : "presence_install", {
    slug: presence.slug,
    version: presence.release.version,
    payload: { source: "extension" },
  });
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
    void trackAnalytics("presence_error", { slug, payload: { stage: "security" } });
    return { ok: false };
  }

  const appName = activity.appName ?? stored.release.metadata.name;
  const normalizedActivity = normalizeActivity(activity, appName);
  const presence = mapPresenceData(normalizedActivity);

  if (tabId) activeTabId = tabId;
  await addActiveSlug(slug);

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

const handleClearActivity = async (slug?: string): Promise<{ ok: boolean }> => {
  activeTabId = null;
  if (slug) {
    await removeActiveSlug(slug, "clear");
  } else {
    await clearActiveSlugs("clear");
  }
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
      trackExtensionOpen();
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
      void trackAnalytics("native_reconnect", { payload: { source: "extension" } });
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
        const deviceId = await getActiveDeviceId();
        delete presences[slug];

        await setPresences(presences);
        await syncDeviceState();
        void trackAnalytics("presence_uninstall", { slug, payload: { source: "extension" } });
        broadcastPresencesChanged();
        await unregisterPresenceScript(slug);
        await removeActiveSlug(slug, "uninstall");
        await fetch(`${getEffectiveApiUrl()}/presences/active/${encodeURIComponent(deviceId)}/${encodeURIComponent(slug)}`, {
          method: "DELETE",
        }).catch(() => {});
        if (activeSlugs.size === 0) {
          await handleClearActivity();
        }
        respond(sendResponse, { ok: true });
      });
      return true;

    case "TOGGLE_PRESENCE":
      getPresences().then(async (presences) => {
        const { slug, enabled } = message.payload as { slug: string; enabled: boolean };
        const deviceId = await getActiveDeviceId();

        if (!presences[slug]) {
          respond(sendResponse, { ok: false });
          return;
        }

        presences[slug].enabled = enabled;
        await setPresences(presences);
        await syncDeviceState();
        void trackAnalytics("presence_toggle", { slug, payload: { enabled } });
        broadcastPresencesChanged();
        if (enabled) {
          const result = await registerPresenceScript(slug, presences[slug]);
          respond(sendResponse, result);
          return;
        }

        await unregisterPresenceScript(slug);
        await removeActiveSlug(slug, "disabled");
        await fetch(`${getEffectiveApiUrl()}/presences/active/${encodeURIComponent(deviceId)}/${encodeURIComponent(slug)}`, {
          method: "DELETE",
        }).catch(() => {});
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
            const installed = presences[slug].release?.version;
            if (installed && latestVersion !== installed) {
              updates[slug] = latestVersion;
            }
          }
        }
        respond(sendResponse, updates);
      });
      return true;

    case "GET_SETTINGS":
      trackExtensionOpen();
      getSettings().then((settings) => respond(sendResponse, settings));
      return true;

    case "SET_SETTINGS":
      getSettings().then((previousSettings) => setSettings(message.payload as Partial<ExtensionSettings>).then((settings) => {
        customApiUrl = settings.customApiBaseUrl;
        void syncDeviceState();
        const partial = message.payload as Partial<ExtensionSettings>;
        const source = previousSettings.analyticsConsent === undefined ? "onboarding" : "settings";
        if (typeof partial.analyticsConsent === "boolean" && partial.analyticsConsent !== previousSettings.analyticsConsent) {
          void trackAnalytics(partial.analyticsConsent ? "analytics_consent_accepted" : "analytics_consent_declined", {
            payload: { source },
          });
          void trackAnalytics("analytics_consent_changed", {
            payload: { enabled: partial.analyticsConsent, source },
          });
        }
        if (partial.presenceDisplayMode || typeof partial.separateActivePresence === "boolean") {
          void trackAnalytics("settings_display_changed", {
            payload: {
              displayMode: settings.presenceDisplayMode,
              separateActivePresence: settings.separateActivePresence,
            },
          });
        }
        if ("customApiBaseUrl" in partial) {
          void trackAnalytics("settings_custom_api_changed", {
            payload: { enabled: Boolean(partial.customApiBaseUrl) },
          });
        }
        respond(sendResponse, settings);
      }));
      return true;

    case "GET_PRESENCE_SETTINGS":
      getPresenceSettings().then((settings) => respond(sendResponse, settings));
      return true;

    case "SET_PRESENCE_SETTINGS": {
      const { slug, partial } = message.payload as { slug: string; partial: Record<string, unknown> };
      void setPresenceSettings(slug, partial).then((settings) => {
        respond(sendResponse, settings);
        void trackAnalytics("settings_presence_changed", {
          slug,
          payload: { settingCount: Object.keys(settings).length },
        });
        getPresences().then(async (presences) => {
          const stored = presences[slug];
          if (stored?.enabled && stored.release?.bundle) {
            void registerPresenceScript(slug, stored);
            // Push updated settings to the already-running presence on the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: "PRESENCE_SETTINGS_UPDATED",
                slug,
                settings,
              }).catch(() => {});
            }
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
    void handleClearActivity(slug);
  }

  if (message.type === "DEBUG") {
    void setDebug({
      stage: payload.stage ?? "presence",
      message: `[${slug}] ${payload.message ?? "debug"}`,
      url: sender.tab?.url,
      updatedAt: Date.now(),
    });
    void trackAnalytics("presence_error", { slug, payload: { stage: payload.stage ?? "presence" } });
  }

  return false;
});

const activeSlugs = new Set<string>();

const getPresenceVersion = async (slug: string): Promise<string | undefined> => {
  const presences = await getPresences();
  return presences[slug]?.release?.version ?? presences[slug]?.metadata?.version ?? undefined;
};

const addActiveSlug = async (slug: string): Promise<void> => {
  activeSlugs.add(slug);
  if (activeSessions.has(slug)) return;
  activeSessions.set(slug, Date.now());
  void trackAnalytics("presence_session_start", {
    slug,
    version: await getPresenceVersion(slug),
  });
};

const removeActiveSlug = async (slug: string, reason: string): Promise<void> => {
  activeSlugs.delete(slug);
  const startedAt = activeSessions.get(slug);
  activeSessions.delete(slug);
  if (!startedAt) return;
  void trackAnalytics("presence_session_end", {
    slug,
    version: await getPresenceVersion(slug),
    payload: {
      durationMs: Math.max(0, Date.now() - startedAt),
      reason,
    },
  });
};

const clearActiveSlugs = async (reason: string): Promise<void> => {
  const slugs = [...activeSlugs];
  await Promise.all(slugs.map((slug) => removeActiveSlug(slug, reason)));
  activeSlugs.clear();
};

chrome.alarms.create("native-heartbeat", { periodInMinutes: 1 });
chrome.alarms.create("api-heartbeat", { periodInMinutes: 5 });
chrome.alarms.create("analytics-flush", { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "native-heartbeat") postNative({ type: "PING" });
  if (alarm.name === "api-heartbeat" && activeSlugs.size > 0) {
    void (async () => {
      const slugs = [...activeSlugs];
      const deviceId = await getActiveDeviceId();
      fetch(`${getEffectiveApiUrl()}/presences/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presences: slugs, deviceId }),
      }).catch(() => {});
      void syncDeviceState();
      for (const slug of slugs) {
          void trackAnalytics("presence_active_heartbeat", {
            slug,
            version: await getPresenceVersion(slug),
            payload: { source: "heartbeat" },
          });
      }
    })();
  }
  if (alarm.name === "analytics-flush") void flushAnalytics();
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

const isUnpackedBuild = (): boolean => !chrome.runtime.getManifest().update_url;

const installBundledPresences = async (): Promise<void> => {
  if (!BUNDLED_PRESENCES?.length && !isUnpackedBuild()) return;
  const presences = await getPresences();
  const bundledSlugs = new Set(BUNDLED_PRESENCES.map((bp) => bp.slug));
  let changed = false;

  if (isUnpackedBuild()) {
    for (const slug of Object.keys(presences)) {
      if (bundledSlugs.has(slug)) continue;
      delete presences[slug];
      await unregisterPresenceScript(slug);
      await removeActiveSlug(slug, "dev-bundle-prune");
      changed = true;
    }
  }

  for (const bp of BUNDLED_PRESENCES) {
    const existing = presences[bp.slug];
    if (existing?.release?.version && existing?.release?.version === bp.release.version) continue;

    presences[bp.slug] = {
      metadata: bp.release.metadata,
      release: bp.release,
      enabled: true,
      installedAt: existing?.installedAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    changed = true;
  }

  if (changed) {
    await setPresences(presences);
    await syncDeviceState();
    broadcastPresencesChanged();
  }
};

chrome.runtime.onStartup.addListener(async () => {
  enableSidePanelAction();
  await handleClearActivity();
  connectNative();
  await initializeCustomApiUrl();
  await syncUninstallUrl();
  await installBundledPresences();
  const presences = await getPresences();
  await syncDeviceState();
  await syncPresenceScripts(presences);
});

chrome.runtime.onInstalled.addListener(async (details) => {
  enableSidePanelAction();
  await handleClearActivity();
  connectNative();
  await initializeCustomApiUrl();
  await syncUninstallUrl();
  await installBundledPresences();
  const presences = await getPresences();
  await syncDeviceState();
  void trackAnalytics(details.reason === "update" ? "extension_update" : "extension_install", {
    payload: { source: "onInstalled", previousVersion: details.previousVersion },
  });
  await syncPresenceScripts(presences);
});

enableSidePanelAction();
void (async () => {
  await handleClearActivity();
  connectNative();
  await initializeCustomApiUrl();
  await syncUninstallUrl();
  await installBundledPresences();
  const presences = await getPresences();
  await syncDeviceState();
  await syncPresenceScripts(presences);
})();
