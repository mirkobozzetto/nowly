import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FC, ReactElement } from "react";

type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown";

type StatusSample = {
  serviceId: string;
  checkedAt: string;
  status: Exclude<ServiceStatus, "unknown">;
  responseMs: number | null;
};

type StatusServiceReport = {
  id: string;
  current: StatusSample | null;
  samples: StatusSample[];
};

const statusBarClasses: Record<ServiceStatus, string> = {
  operational: "bg-success",
  slow: "bg-warning",
  degraded: "bg-warning",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/20",
};

const formatDateTime = (date: string, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const getSampleTitle = (
  sample: StatusSample | null,
  locale: string,
  labels: Record<ServiceStatus, string>,
  noData: string,
): string => {
  if (!sample) return noData;

  const latency = sample.responseMs === null ? noData : `${sample.responseMs} ms`;

  return `${formatDateTime(sample.checkedAt, locale)} · ${labels[sample.status]} · ${latency}`;
};

export const StatusHistory: FC<{
  service: StatusServiceReport;
  locale: string;
  labels: Record<ServiceStatus, string>;
  noData: string;
  historyLabel: string;
}> = ({ service, locale, labels, noData, historyLabel }): ReactElement => {
  const reversed = service.samples.slice(0, 18).reverse();
  const samples = Array.from({ length: 18 }, (_, index) => reversed[index] ?? null);

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <div
          className="flex h-9 min-w-0 items-end gap-1"
          aria-label={historyLabel}
        >
          {samples.map((sample, index) => {
            const status = sample?.status ?? "unknown";
            const tooltip = getSampleTitle(sample, locale, labels, noData);

            return (
              <Tooltip key={`${sample?.checkedAt ?? "empty"}-${index}`}>
                <TooltipTrigger
                  aria-label={tooltip}
                  className={cn("h-full w-1.5 cursor-default rounded-md outline-none", statusBarClasses[status])}
                />

                <TooltipContent side="top">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </>
  );
};