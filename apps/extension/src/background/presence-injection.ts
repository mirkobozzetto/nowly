import type { RegisteredUserScript, ChromeWithUserScripts } from "./user-scripts";
import { getPresenceSettings } from "./storage";

export interface PresenceInjector {
  register(script: RegisteredUserScript): Promise<void>;
  unregister(id: string): Promise<void>;
  getRegistered(ids: string[]): Promise<RegisteredUserScript[]>;
}

const patternToRegExp = (pattern: string): RegExp => {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
};

export const matchesPattern = (url: string, pattern: string): boolean => {
  try {
    return patternToRegExp(pattern).test(url);
  } catch {
    return false;
  }
};

// --- Chrome implementation (delegates to chrome.userScripts) ---

class ChromePresenceInjector implements PresenceInjector {
  private get api() {
    return (chrome as ChromeWithUserScripts).userScripts;
  }

  async register(script: RegisteredUserScript): Promise<void> {
    const api = this.api;
    if (!api) return;
    try {
      await api.register([script]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("duplicate")) throw error;
      await api.unregister({ ids: [script.id] });
      await api.register([script]);
    }
  }

  async unregister(id: string): Promise<void> {
    const api = this.api;
    if (!api) return;
    const scripts = await api.getScripts({ ids: [id] });
    if (!scripts.length) return;
    await api.unregister({ ids: [id] });
  }

  async getRegistered(ids: string[]): Promise<RegisteredUserScript[]> {
    const api = this.api;
    if (!api) return [];
    return (await api.getScripts({ ids })) as RegisteredUserScript[];
  }
}

// --- Firefox implementation ---
// Firefox MV3 has no userScripts API, and scripting.executeScript inherits the page's CSP
// (even in ISOLATED world), so new Function()/eval() are blocked on strict-dynamic pages
// like YouTube. The only CSP-exempt path is injecting a pre-built static file via
// scripting.executeScript({ files }), which the browser compiles natively. We therefore
// ship one runtime.js per presence (generated at build time) and inject it here, after
// seeding settings into a global via a static func.

class FirefoxPresenceInjector implements PresenceInjector {
  private readonly scripts = new Map<string, RegisteredUserScript>();

  async register(script: RegisteredUserScript): Promise<void> {
    this.scripts.set(script.id, script);
    // tabs.onUpdated only fires on future navigations; inject into already-open matching tabs now.
    try {
      const tabs = await chrome.tabs.query({ url: script.matches });
      await Promise.all(tabs.map((tab) => (tab.id != null ? this.runScript(tab.id, script) : undefined)));
    } catch (error) {
      console.error("[nowly] failed to inject into open tabs", error);
    }
  }

  async unregister(id: string): Promise<void> {
    this.scripts.delete(id);
  }

  async getRegistered(ids: string[]): Promise<RegisteredUserScript[]> {
    if (!ids.length) return [...this.scripts.values()];
    return ids.flatMap((id) => {
      const s = this.scripts.get(id);
      return s ? [s] : [];
    });
  }

  async injectIntoTab(tabId: number, tabUrl: string): Promise<void> {
    for (const script of this.scripts.values()) {
      if (!script.matches.some((p) => matchesPattern(tabUrl, p))) continue;
      // eslint-disable-next-line no-await-in-loop
      await this.runScript(tabId, script);
    }
  }

  private async runScript(tabId: number, script: RegisteredUserScript): Promise<void> {
    const slug = script.id.replace("nowly-presence-", "");
    try {
      // Step 1: expose current settings as a global via a plain static func.
      // The browser compiles this function natively (privileged extension call) — no eval from
      // our JS, so page CSP cannot block it.
      const allSettings = await getPresenceSettings();
      const settings = (allSettings[slug] ?? {}) as Record<string, unknown>;
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        func: (s: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).__nowly_settings__ = s;
        },
        args: [settings],
        world: "ISOLATED",
      });
      // Step 2: inject the pre-built presence runtime file.
      // File injection is handled natively by the browser (same as Chrome's userScripts.register),
      // bypassing page CSP without any eval/new Function in our code.
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: [`presences/${slug}/runtime.js`],
        world: "ISOLATED",
      });
    } catch (error) {
      console.error(`[nowly] presence injection failed for ${script.id}`, error);
    }
  }
}

export const presenceInjector: PresenceInjector =
  import.meta.env.BROWSER === "firefox"
    ? new FirefoxPresenceInjector()
    : new ChromePresenceInjector();

export const firefoxInjector =
  import.meta.env.BROWSER === "firefox"
    ? (presenceInjector as FirefoxPresenceInjector)
    : null;
