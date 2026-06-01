import { WEB_BASE_URL } from "./constants";

export const assetUrl = (slug: string, type: "icon" | "logo" | "thumbnail"): string =>
  `${WEB_BASE_URL}/api/p/${slug}/assets/${type}`;

export const fetchPresenceMetadata = async (slug: string): Promise<unknown> => {
  const response = await fetch(`${WEB_BASE_URL}/api/p/${slug}/metadata`);
  if (!response.ok) throw new Error(`metadata request failed: ${response.status}`);
  return response.json();
};

export const fetchPresenceBundle = async (slug: string): Promise<string> => {
  const response = await fetch(`${WEB_BASE_URL}/api/p/${slug}/bundle`);
  if (!response.ok) throw new Error(`bundle request failed: ${response.status}`);
  return response.text();
};
