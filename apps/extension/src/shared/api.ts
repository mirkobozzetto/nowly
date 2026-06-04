import { API_BASE_URL, CDN_BASE_URL } from "./constants";

const ASSET_EXT: Record<string, string> = {
  logo: ".png",
  icon: ".png",
  thumbnail: ".jpg",
};

export const assetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string =>
  `${CDN_BASE_URL}/presences/${slug}/assets/${type}${ASSET_EXT[type]}`;

export const fetchPresenceMetadata = async (slug: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/presences/${slug}`);
  if (!response.ok) throw new Error(`metadata request failed: ${response.status}`);
  return response.json();
};
