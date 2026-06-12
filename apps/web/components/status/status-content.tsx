import { StatusHistory } from "@/components/status/status-history";
import { cn } from "@/lib/utils";
import { Activity, Database, Globe2, HardDriveDownload, type LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown";
type StatusServiceId = "website" | "api" | "library" | "cdn";

type StatusSample = {
  serviceId: StatusServiceId;
  checkedAt: string;
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
  httpStatus: number | null;
  error: string | null;
};

type StatusServiceReport = {
  id: StatusServiceId;
  current: StatusSample | null;
  samples: StatusSample[];
};

type StatusReport = {
  generatedAt: string;
  checkIntervalHours: number;
  overallStatus: ServiceStatus;
  services: StatusServiceReport[];
};

const statusBadgeClasses: Record<ServiceStatus, string> = {
  operational: "border-success/20 bg-success/10 text-success",
  slow: "border-warning/20 bg-warning/10 text-warning",
  degraded: "border-warning/20 bg-warning/10 text-warning",
  down: "border-destructive/20 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

const serviceIconMap: Record<StatusServiceId, LucideIcon> = {
  website: Globe2,
  api: Activity,
  library: Database,
  cdn: HardDriveDownload,
};

const emptyServices: StatusServiceReport[] = [
  { id: "website", current: null, samples: [] },
  { id: "api", current: null, samples: [] },
  { id: "library", current: null, samples: [] },
  { id: "cdn", current: null, samples: [] },
];

export const StatusContent: FC = async (): Promise<ReactElement> => {
  const t = await getTranslations("StatusPage");
  const locale = await getLocale();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me";
  let report: StatusReport;

  try {
    const res = await fetch(`${apiBase}/status`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    report = await res.json() as StatusReport;
  } catch {
    report = {
      generatedAt: new Date().toISOString(),
      checkIntervalHours: 1,
      overallStatus: "unknown",
      services: emptyServices,
    };
  }

  const labels: Record<ServiceStatus, string> = {
    operational: t("statusLabels.operational"),
    slow: t("statusLabels.slow"),
    degraded: t("statusLabels.degraded"),
    down: t("statusLabels.down"),
    unknown: t("statusLabels.unknown"),
  };

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-6 py-24">
      <div className="mb-12 min-w-0 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
          {t("badge")}
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
          {t("title")}
        </h1>

        <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <section className="mb-6 rounded-lg border border-border bg-card p-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground">
              {t(`overall.${report.overallStatus}`)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("checkedHistory", { hours: report.checkIntervalHours })}
            </p>
          </div>

          <span className={cn("w-fit shrink-0 rounded-full border px-3 py-1 text-sm font-medium", statusBadgeClasses[report.overallStatus])}>
            {labels[report.overallStatus]}
          </span>
        </div>
      </section>

      <div className="grid min-w-0 gap-4">
        {report.services.map((service) => {
          const Icon = serviceIconMap[service.id];
          const status = service.current?.status ?? "unknown";
          const latency = service.current?.responseMs === null || !service.current ? null : `${service.current.responseMs} ms`;

          return (
            <article key={service.id} className="min-w-0 rounded-lg border border-border bg-card p-5">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-foreground">
                      {t(`services.${service.id}.title`)}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 sm:shrink-0 sm:justify-end">
                  {service.current ? (
                    <>
                      {latency ? (
                        <span className="rounded border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground">
                          {latency}
                        </span>
                      ) : null}
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", statusBadgeClasses[status])}>
                        {labels[status]}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <StatusHistory
                service={service}
                locale={locale}
                labels={labels}
                noData={t("noData")}
                historyLabel={t("historyLabel")}
              />
            </article>
          );
        })}
      </div>
    </main>
  );
};
