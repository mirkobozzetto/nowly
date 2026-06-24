import type { PresenceData } from "@/shared/types";
import { handleActivityUpdate, handleClearActivity } from "../managers/activity-manager";
import { trackAnalytics } from "../analytics/analytics-tracker";
import { USER_SCRIPT_MESSAGE_SOURCE } from "./presence-runtime";
import { setDebug } from "../services/storage";

export const registerPresenceRuntimeBridge = (): void => {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.source !== USER_SCRIPT_MESSAGE_SOURCE) return false;

    const payload = message.payload as { slug?: string; activity?: PresenceData; stage?: string; message?: string } | undefined;
    const slug = payload?.slug;
    if (!slug) return false;

    if (message.type === "ACTIVITY_UPDATE" && payload.activity) {
      void handleActivityUpdate(slug, payload.activity, sender.tab?.id);
    }

    if (message.type === "CLEAR_ACTIVITY") {
      void handleClearActivity(slug);
    }

    if (message.type === "DEBUG") {
      void setDebug({
        stage: payload.stage ?? "presence",
        message: `[${slug}] ${payload.message ?? "debug"}`,
        url: sender.tab?.url,
        updatedAt: Date.now(),
      });
      void trackAnalytics("presence_error", { slug, payload: { stage: payload.stage ?? "presence" } });
    }

    return false;
  });
};