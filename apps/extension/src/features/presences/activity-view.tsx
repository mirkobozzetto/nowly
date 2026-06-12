import { RefreshCw } from "lucide-react";
import type { FC, ReactElement } from "react";
import { CurrentActivityCard } from "@/features/presences/current-activity-card";
import { PresenceList } from "@/features/presences/presence-list";
import { t } from "@/shared/i18n";
import type { CurrentActivity, ExtensionSettings, InstalledPresences } from "@/shared/types";

type Props = {
  activity: CurrentActivity | null;
  checkUpdates: () => void;
  entries: Array<[string, InstalledPresences[string]]>;
  isCheckingUpdates: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  updates: Record<string, string>;
};

export const ActivityView: FC<Props> = ({
  activity,
  checkUpdates,
  entries,
  isCheckingUpdates,
  onOpenMarketplace,
  onRemove,
  onToggle,
  presences,
  settings,
  updates,
}): ReactElement => (
  <section className="flex min-h-0 flex-1 flex-col gap-3">
    {settings.showPlayer ? <CurrentActivityCard activity={activity} presences={presences} /> : null}
    <PresenceList
      activeSlug={activity?.slug ?? null}
      displayMode={settings.presenceDisplayMode}
      entries={entries}
      onOpenMarketplace={onOpenMarketplace}
      onToggle={onToggle}
      onRemove={onRemove}
      separateActive={settings.separateActivePresence}
      updates={updates}
    />
    <button
      type="button"
      aria-label={t("checkUpdates")}
      title={t("checkUpdates")}
      onClick={checkUpdates}
      disabled={isCheckingUpdates}
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isCheckingUpdates ? "animate-spin" : ""}`} />
      {t("checkUpdates")}
    </button>
  </section>
);
