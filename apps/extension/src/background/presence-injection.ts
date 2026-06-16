import type { RegisteredUserScript, ChromeWithUserScripts } from "./user-scripts";

export interface PresenceInjector {
  register(script: RegisteredUserScript): Promise<void>;
  unregister(id: string): Promise<void>;
  getRegistered(ids: string[]): Promise<RegisteredUserScript[]>;
}

// Converts a Chrome match pattern (e.g. "*://*.youtube.com/*") to a RegExp.
const patternToRegExp = (pattern: string): RegExp => {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*");
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
    return api.getScripts({ ids });
  }
}

// --- Firefox implementation (uses scripting.executeScript + in-memory map) ---

class FirefoxPresenceInjector implements PresenceInjector {
  private readonly scripts = new Map<string, RegisteredUserScript>();

  async register(script: RegisteredUserScript): Promise<void> {
    this.scripts.set(script.id, script);
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
      const matches = script.matches.some((p) => matchesPattern(tabUrl, p));
      if (!matches) continue;

      const code = script.js[0]?.code;
      if (!code) continue;

      // eslint-disable-next-line no-await-in-loop
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: script.allFrames ?? false },
        // func + args is the only way to inject a dynamic code string via scripting.executeScript.
        // The function is serialized by the browser; args are passed as JSON.
        // eslint-disable-next-line no-new-func
        func: (presenceCode: string) => { new Function(presenceCode)(); },
        args: [code],
        world: "MAIN",
      }).catch(() => {
        // Tab may have navigated away or be inaccessible.
      });
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
