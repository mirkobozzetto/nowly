import { StatusHistory } from "@/components/status/status-history";
import { fetchStatusReport, ServiceStatus, statusBadgeClasses, StatusServiceId } from "@/features/status/status";
import { createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Activity, Database, Globe2, HardDriveDownload, LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Status",
    description: "Service status for Nowly website, API, presence library and host downloads.",
    path: "/status",
  });
};

export { generateMetadata };

const serviceIconMap: Record<StatusServiceId, LucideIcon> = {
  website: Globe2,
  api: Activity,
  library: Database,
  cdn: HardDriveDownload,
};

function formatRelativeTime(locale: string, generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDays > 0) return rtf.format(-diffDays, "day");
  if (diffHours > 0) return rtf.format(-diffHours, "hour");
  if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");
  return rtf.format(-diffSeconds, "second");
}

export default async function StatusPage(): Promise<ReactElement> {
  const t = await getTranslations("StatusPage");
  const locale = await getLocale();
  const report = await fetchStatusReport();

  const labels: Record<ServiceStatus, string> = {
    operational: t("statusLabels.operational"),
    slow: t("statusLabels.slow"),
    degraded: t("statusLabels.degraded"),
    down: t("statusLabels.down"),
    unknown: t("statusLabels.unknown"),
  };

  return (
    <main className="mx-auto w-full max-w-4xl min-w-0 px-6 py-24">
      <div className="mb-12 min-w-0 py-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent border border-accent/20">
          {t("badge")}
        </div>

        <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
          {t("title")}
        </h1>

        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">
            {t("checkedHistory", { time: formatRelativeTime(locale, report.generatedAt) })}
          </h2>
        </div>

        <div className="divide-y divide-border">
          {report.services.map((service) => {
            const Icon = serviceIconMap[service.id];
            const status = service.current?.status ?? "unknown";
            const latency =
              service.current?.responseMs === null || !service.current
                ? null
                : `${service.current.responseMs} ms`;

            return (
              <article
                key={service.id}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </span>

                  <div className="flex flex-col">
                    <h3 className="truncate font-semibold text-foreground">
                      {t(`services.${service.id}.title`)}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {latency ?? t("noData")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:justify-end">
                  <div className="flex items-center lg:justify-end">
                    <span
                      className={cn(
                        "w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                        statusBadgeClasses[status],
                      )}
                    >
                      {labels[status]}
                    </span>
                  </div>

                  <StatusHistory
                    service={service}
                    locale={locale}
                    labels={labels}
                    noData={t("noData")}
                    historyLabel={t("historyLabel")}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}