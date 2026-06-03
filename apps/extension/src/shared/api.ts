import { API_BASE_URL, CDN_BASE_URL } from "./constants";

export const assetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string =>
  `${CDN_BASE_URL}/presences/${slug}/assets/${type}`;

export const fetchPresenceMetadata = async (slug: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/presences/${slug}`);
  if (!response.ok) throw new Error(`metadata request failed: ${response.status}`);
  return response.json();
};
