import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

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

const statusDotClasses: Record<ServiceStatus, string> = {
  operational: "bg-success",
  slow: "bg-warning",
  degraded: "bg-warning",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/25",
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
  return `${formatDateTime(sample.checkedAt, locale)} - ${labels[sample.status]} - ${latency}`;
};

export const StatusHistory = ({
  service,
  locale,
  labels,
  noData,
  historyLabel,
}: {
  service: StatusServiceReport;
  locale: string;
  labels: Record<ServiceStatus, string>;
  noData: string;
  historyLabel: string;
}): ReactElement => {
  const reversed = service.samples.slice(0, 10).reverse();
  const samples = Array.from({ length: 10 }, (_, index) => reversed[index] ?? null);

  return (
    <div className="mt-4">
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-10 gap-1" aria-label={historyLabel}>
          {samples.map((sample, index) => {
            const status = sample?.status ?? "unknown";
            const tooltip = getSampleTitle(sample, locale, labels, noData);

            return (
              <Tooltip key={`${sample?.checkedAt ?? "empty"}-${index}`}>
                <TooltipTrigger
                  aria-label={tooltip}
                  className={cn(
                    "h-2.5 cursor-default rounded-sm border-none outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-y-125",
                    statusDotClasses[status],
                  )}
                />
                <TooltipContent side="top">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};
