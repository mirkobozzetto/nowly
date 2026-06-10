import { API_BASE_URL, CDN_BASE_URL } from "./constants";

const ASSET_EXT: Record<string, string> = {
  logo: ".png",
  icon: ".png",
  thumbnail: ".jpg",
};

export const assetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string => {
  const ext = ASSET_EXT[type]
  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/presences/${slug}/assets/${type}${ext}`
  }
  return chrome.runtime.getURL(`presences/${slug}/assets/${type}${ext}`)
}

export const fetchPresenceMetadata = async (slug: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/presences/${slug}`);
  if (!response.ok) throw new Error(`metadata request failed: ${response.status}`);
  return response.json();
};
