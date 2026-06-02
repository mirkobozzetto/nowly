import { API_BASE_URL } from "./constants";

export const ASSET_URL = (slug: string, type: string): string =>
  `${API_BASE_URL}/presences/${slug}/assets/${type}`;
