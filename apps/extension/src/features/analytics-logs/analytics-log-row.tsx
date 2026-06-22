import type { AnalyticsLogEntry } from "@/shared/types";
import type { FC } from "react";
import { formatTime, levelClass } from "./analytics-logs.model";

type Props = {
  log: AnalyticsLogEntry;
};

export const AnalyticsLogRow: FC<Props> = ({ log }) => (
  <article className="space-y-2 p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{log.message}</p>
        <p className="text-[11px] text-muted-foreground">{formatTime(log.at)} Â· {log.type}</p>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${levelClass[log.level]}`}>
        {log.level}
      </span>
    </div>
    {log.payload ? (
      <pre className="max-h-24 overflow-auto rounded-md bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(log.payload, null, 2)}
      </pre>
    ) : null}
  </article>
);