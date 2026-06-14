export type AnalyticsLogLevel = "info" | "success" | "warn" | "error";

export type AnalyticsLogType = "analytics" | "api" | "presence" | "native" | "settings";

export type AnalyticsLogEntry = {
  id: string;
  at: number;
  level: AnalyticsLogLevel;
  type: AnalyticsLogType;
  message: string;
  payload?: Record<string, string | number | boolean | null>;
};
