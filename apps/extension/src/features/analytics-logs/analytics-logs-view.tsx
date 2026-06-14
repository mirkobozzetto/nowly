import { Copy, Trash2 } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { sendMessage } from "@/lib/messages";
import type { AnalyticsLogEntry, AnalyticsLogLevel, AnalyticsLogType } from "@/shared/types";

type Filter = "all" | AnalyticsLogType;

const filters: Filter[] = ["all", "analytics", "api", "presence", "native"];

const levelClass: Record<AnalyticsLogLevel, string> = {
  info: "border-border-light bg-card-2 text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warn: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

const formatTime = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));

export const AnalyticsLogsView: FC = (): ReactElement => {
  const [logs, setLogs] = useState<AnalyticsLogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void sendMessage<AnalyticsLogEntry[]>("GET_ANALYTICS_LOGS").then((entries) => {
      setLogs(entries ?? []);
    });

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source !== "PRESENCES_BACKGROUND" || message.type !== "ANALYTICS_LOG_ADDED") return;
      const entry = message.payload as AnalyticsLogEntry | undefined;
      if (!entry?.id) return;
      setLogs((current) => [...current, entry].slice(-500));
    };

    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(onRuntimeMessage);
  }, []);

  const visibleLogs = useMemo(
    () => logs.filter((log) => filter === "all" || log.type === filter).slice().reverse(),
    [filter, logs],
  );

  const clearLogs = useCallback((): void => {
    void sendMessage<{ ok: boolean }>("CLEAR_ANALYTICS_LOGS").then(() => setLogs([]));
  }, []);

  const copyLogs = useCallback((): void => {
    void navigator.clipboard?.writeText(JSON.stringify(visibleLogs, null, 2));
  }, [visibleLogs]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Analytics logs</p>
          <p className="text-xs text-muted-foreground">Dev only / unpacked only</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="unstyled"
            size="none"
            onClick={copyLogs}
            className="flex h-8 items-center gap-1 rounded-md border border-border bg-card-2 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Copy visible logs as JSON"
          >
            <Copy className="h-3.5 w-3.5" />
            JSON
          </Button>
          <Button
            variant="unstyled"
            size="none"
            onClick={clearLogs}
            className="flex h-8 items-center gap-1 rounded-md border border-border bg-card-2 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {filters.map((item) => (
          <Button
            key={item}
            variant="unstyled"
            size="none"
            onClick={() => setFilter(item)}
            className={
              filter === item
                ? "shrink-0 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-background"
                : "shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-card">
        {visibleLogs.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-xs text-muted-foreground">
            No logs yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleLogs.map((log) => (
              <article key={log.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{log.message}</p>
                    <p className="text-[11px] text-muted-foreground">{formatTime(log.at)} · {log.type}</p>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
