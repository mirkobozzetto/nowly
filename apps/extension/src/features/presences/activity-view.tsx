import { CurrentActivityCard } from "@/features/presences/current-activity-card";
import { PresenceList } from "@/features/presences/presence-list";
import type { CurrentActivity, ExtensionSettings, InstalledPresences } from "@/shared/types";
import type { FC, ReactElement } from "react";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isLoading: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  updates: Record<string, string>;
};

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  isLoading,
  onOpenMarketplace,
  onRemove,
  onSchedule,
  onToggle,
  presences,
  settings,
  updates,
}): ReactElement => (
  <section className="flex min-h-0 flex-1 flex-col gap-3">
    {settings.showPlayer ? <CurrentActivityCard activity={activity} isLoading={isLoading} presences={presences} /> : null}
    <PresenceList
      isLoading={isLoading}
      activeSlug={activity?.slug ?? null}
      displayMode={settings.presenceDisplayMode}
      entries={entries}
      onOpenMarketplace={onOpenMarketplace}
      onRemove={onRemove}
      onSchedule={onSchedule}
      onToggle={onToggle}
      separateActive={settings.separateActivePresence}
      showSchedule={settings.scheduleEnabled !== false}
      updates={updates}
    />
  </section>
);
