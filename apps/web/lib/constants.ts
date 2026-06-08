import { Presence } from "./data/presences";

export const API_BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) || "https://api.nowly.me";

export const PROJECT_NAME = "Nowly";
export const PROJECT_REPOSITORY_URL = "https://github.com/q-kimi/nowly";
export const PROJECT_PRESENCES_SOURCE_URL = `${PROJECT_REPOSITORY_URL}/tree/stable/packages/websites/src`;
export const PROJECT_EXTENSION_DOWNLOAD_URL = `https://chromewebstore.google.com/detail/ipgpkagmbaieiijamcaoemdiljeojlnk/`;
export const PROJECT_EXTENSION_FILENAME = "Nowly-Extension.zip";

export const ADSENSE_CLIENT_ID = "ca-pub-6330177306711077";
export const LANDING_AD_SLOT = "4584618586";
export const LIBRARY_AD_SLOT = "8815663161";

export const buildPresenceUrl = (platform: Presence): string => {
  const firstChar = platform.slug.charAt(0);
  const prefix = /^[0-9]$/.test(firstChar) ? "#" : firstChar.toUpperCase();
  return `${PROJECT_PRESENCES_SOURCE_URL}/${prefix}/${platform.name}`;
};