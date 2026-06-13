import { t } from "@/shared/i18n";
import { Activity, ListTree, Settings } from "lucide-react";
import type { FC, ReactElement } from "react";

export type SidepanelView = "activity" | "settings" | "analyticsLogs";

type Props = {
  activeView: SidepanelView;
  onChange: (view: SidepanelView) => void;
  showAnalyticsLogs?: boolean;
};

type TranslationKey = Parameters<typeof t>[0];

const items: Array<{ icon: typeof Activity; label: TranslationKey; view: SidepanelView }> = [
  { icon: Activity, label: "activityTab", view: "activity" },
  { icon: Settings, label: "settingsTab", view: "settings" },
  { icon: ListTree, label: "analyticsLogsTab", view: "analyticsLogs" },
];

export const SidepanelNav: FC<Props> = ({ activeView, onChange, showAnalyticsLogs = false }): ReactElement => {
  const visibleItems = items.filter((item) => item.view !== "analyticsLogs" || showAnalyticsLogs);

  return (
    <nav className={`grid gap-1 rounded-lg border border-border bg-card p-1 ${visibleItems.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.view;

        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onChange(item.view)}
            className={
              active
                ? "flex h-9 items-center justify-center gap-1.5 rounded-md bg-card-2 text-xs font-semibold text-foreground"
                : "flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="truncate">{t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  );
};