import type { FC, ReactElement } from "react";
import { CurrentActivityCard } from "@/features/presences/current-activity-card";
import { PresenceList } from "@/features/presences/presence-list";
import type { CurrentActivity, ExtensionSettings, InstalledPresences } from "@/shared/types";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  updates: Record<string, string>;
};

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  onOpenMarketplace,
  onRemove,
  onToggle,
  presences,
  settings,
  updates,
}): ReactElement => (
  <section className="flex min-h-0 flex-1 flex-col gap-3">
    <CurrentActivityCard activity={activity} presences={presences} />
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
  </section>
);
