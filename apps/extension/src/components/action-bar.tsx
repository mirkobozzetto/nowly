import { Calendar, RefreshCw, Snowflake, Sun } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useRef } from "react";
import { t } from "@/shared/i18n";

const CHECK_RATE_LIMIT_MS = 30_000;

type Props = {
  activeSlug: string | null;
  isCheckingUpdates: boolean;
  isSnoozed: boolean;
  scheduleEnabled: boolean;
  onCheckUpdates: () => void;
  onScheduleClick: () => void;
  onSnoozeClick: () => void;
  onUnsnoozeClick: () => void;
};

export const ActionBar: FC<Props> = ({ activeSlug, isCheckingUpdates, isSnoozed, scheduleEnabled, onCheckUpdates, onScheduleClick, onSnoozeClick, onUnsnoozeClick }): ReactElement => {
  const lastCheckRef = useRef(0);

  const handleCheckUpdates = (): void => {
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_RATE_LIMIT_MS) return;
    lastCheckRef.current = now;
    onCheckUpdates();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      {isSnoozed ? (
        <button
          type="button"
          onClick={onUnsnoozeClick}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
        >
          <Sun className="h-3.5 w-3.5" />
          {t("clearSnooze")}
        </button>
      ) : (
        <button
          type="button"
          disabled={!activeSlug}
          onClick={onSnoozeClick}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <Snowflake className="h-3.5 w-3.5" />
          {t("snooze")}
        </button>
      )}

      {scheduleEnabled ? (
        <>
          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            onClick={onScheduleClick}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          >
            <Calendar className="h-3.5 w-3.5" />
            {t("schedule")}
          </button>
        </>
      ) : null}

      <div className="mx-1 h-4 w-px bg-border" />

      <button
        type="button"
        aria-label={t("checkUpdates")}
        title={t("checkUpdates")}
        onClick={handleCheckUpdates}
        disabled={isCheckingUpdates}
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isCheckingUpdates ? "animate-spin" : ""}`} />
        {t("checkUpdates")}
      </button>
    </div>
  );
};