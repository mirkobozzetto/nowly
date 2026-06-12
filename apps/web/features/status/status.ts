export type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown";
export type StatusServiceId = "website" | "api" | "library" | "cdn";

export type StatusSample = {
  serviceId: StatusServiceId;
  checkedAt: string;
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
  httpStatus: number | null;
  error: string | null;
};

export type StatusServiceReport = {
  id: StatusServiceId;
  current: StatusSample | null;
  samples: StatusSample[];
};

export type StatusReport = {
  generatedAt: string;
  checkIntervalHours: number;
  overallStatus: ServiceStatus;
  services: StatusServiceReport[];
};

export const statusBadgeClasses: Record<ServiceStatus, string> = {
  operational: "border-success/20 bg-success/10 text-success",
  slow: "border-warning/20 bg-warning/10 text-warning",
  degraded: "border-warning/20 bg-warning/10 text-warning",
  down: "border-destructive/20 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const emptyServices: StatusServiceReport[] = [
  { id: "website", current: null, samples: [] },
  { id: "api", current: null, samples: [] },
  { id: "library", current: null, samples: [] },
  { id: "cdn", current: null, samples: [] },
];

export const getFallbackStatusReport = (): StatusReport => ({
  generatedAt: new Date().toISOString(),
  checkIntervalHours: 1,
  overallStatus: "unknown",
  services: emptyServices,
});

export const fetchStatusReport = async (): Promise<StatusReport> => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me";

  try {
    const res = await fetch(`${apiBase}/status`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    return await res.json() as StatusReport;
  } catch {
    return getFallbackStatusReport();
  }
};