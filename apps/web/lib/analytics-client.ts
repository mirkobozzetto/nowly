import { API_BASE_URL } from "@/lib/constants";

type AnalyticsEvent = {
  key: string
  slug?: string
  version?: string
  payload?: Record<string, unknown>
};

export const trackPublicAnalytics = (event: AnalyticsEvent): void => {
  if (typeof window === "undefined") return;

  void fetch(`${API_BASE_URL}/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
    keepalive: true,
  }).catch(() => {
    // Best effort analytics only.
  });
};
