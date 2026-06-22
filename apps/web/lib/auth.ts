const TOKEN_KEY = "nowly_discord_token";

export interface DiscordUser {
  discordId: string
  username: string
  globalName: string
  avatar: string | null
}

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getTokenFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const fromHash = new URLSearchParams(hash).get("token");
  if (fromHash) return fromHash;
  return new URLSearchParams(window.location.search).get("token");
};

export const cleanupUrlToken = (): void => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;

  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const hashParams = new URLSearchParams(hash);
  if (hashParams.has("token")) {
    hashParams.delete("token");
    const rest = hashParams.toString();
    url.hash = rest ? `#${rest}` : "";
    changed = true;
  }

  if (url.searchParams.has("token")) {
    url.searchParams.delete("token");
    changed = true;
  }

  if (changed) {
    window.history.replaceState({}, "", url.toString());
  }
};

export const getErrorFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("error");
};

export const cleanupUrlError = (): void => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("error")) {
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }
};