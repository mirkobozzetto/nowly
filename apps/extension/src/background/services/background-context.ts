let customApiUrl: string | undefined;
let cachedDeviceId: string | null = null;
let activeTabId: number | null = null;
const activeSlugs = new Set<string>();
const activeSessions = new Map<string, number>();

export const getCustomApiUrl = (): string | undefined => customApiUrl;

export const setCustomApiUrl = (value: string | undefined): void => {
  customApiUrl = value;
};

export const getCachedDeviceId = (): string | null => cachedDeviceId;

export const setCachedDeviceId = (value: string): void => {
  cachedDeviceId = value;
};

export const getActiveTabId = (): number | null => activeTabId;

export const setActiveTabId = (value: number | null): void => {
  activeTabId = value;
};

export const addActiveSlugToState = (slug: string): void => {
  activeSlugs.add(slug);
};

export const removeActiveSlugFromState = (slug: string): void => {
  activeSlugs.delete(slug);
};

export const clearActiveSlugsFromState = (): void => {
  activeSlugs.clear();
};

export const hasActiveSlugs = (): boolean => activeSlugs.size > 0;

export const getActiveSlugsSnapshot = (): string[] => [...activeSlugs];

export const hasActiveSession = (slug: string): boolean => activeSessions.has(slug);

export const getActiveSessionStartedAt = (slug: string): number | undefined => activeSessions.get(slug);

export const setActiveSessionStartedAt = (slug: string, startedAt: number): void => {
  activeSessions.set(slug, startedAt);
};

export const removeActiveSession = (slug: string): void => {
  activeSessions.delete(slug);
};