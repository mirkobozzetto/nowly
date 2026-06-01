import type { FC, ReactElement } from "react";
import { CurrentActivityCard } from "../../popup/components/CurrentActivityCard";
import { PresenceList } from "../../popup/components/PresenceList";
import type { CurrentActivity, InstalledPresences } from "../../shared/types";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presences: InstalledPresences;
};

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  onRemove,
  onToggle,
  presences,
}): ReactElement => (
  <section className="flex min-h-0 flex-1 flex-col gap-3">
    <CurrentActivityCard activity={activity} presences={presences} />
    <PresenceList entries={entries} onToggle={onToggle} onRemove={onRemove} />
  </section>
);
