import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC } from "react";
import { EmptyState } from "./empty-state";
import { PresenceListSection } from "./presence-list-section";
import { PresenceListSkeleton } from "./presence-list-skeleton";
import { getCategoryLabel, groupByCategory, sortAlphabetically, type PresenceListEntry } from "./presence-list.model";

type Props = {
  activeSlug: string | null;
  displayMode: PresenceDisplayMode;
  entries: PresenceListEntry[];
  isLoading: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  separateActive: boolean;
  showSchedule: boolean;
  updates: Record<string, string>;
};

export const PresenceList: FC<Props> = ({
  activeSlug,
  displayMode,
  entries,
  isLoading,
  onOpenMarketplace,
  onRemove,
  onSchedule,
  onToggle,
  separateActive,
  showSchedule,
  updates,
}) => {
  if (isLoading) return <PresenceListSkeleton />;

  const filtered = separateActive && activeSlug
    ? entries.filter(([slug]) => slug !== activeSlug)
    : entries;

  if (filtered.length === 0) return <EmptyState />;

  const disabledEntries = filtered.filter(([, p]) => !p.enabled);
  const hasDisabled = disabledEntries.length > 0;

  if (displayMode === "alphabetical") {
    const activeSorted = sortAlphabetically(filtered.filter(([, p]) => p.enabled));

    if (!hasDisabled) {
      return (
        <section className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <PresenceListSection
              entries={activeSorted}
              onOpenMarketplace={onOpenMarketplace}
              onRemove={onRemove}
              onSchedule={onSchedule}
              onToggle={onToggle}
              showSchedule={showSchedule}
              updates={updates}
            />
          </div>
        </section>
      );
    }

    return (
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("active-presences")}
            </h2>
            <PresenceListSection
              entries={activeSorted}
              onOpenMarketplace={onOpenMarketplace}
              onRemove={onRemove}
              onSchedule={onSchedule}
              onToggle={onToggle}
              showSchedule={showSchedule}
              updates={updates}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("disabled-presences")}
            </h2>
            <PresenceListSection
              entries={sortAlphabetically(disabledEntries)}
              onOpenMarketplace={onOpenMarketplace}
              onRemove={onRemove}
              onSchedule={onSchedule}
              onToggle={onToggle}
              showSchedule={showSchedule}
              updates={updates}
            />
          </section>
        </div>
      </section>
    );
  }

  const groups = groupByCategory(filtered);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {groups.map(([category, categoryEntries]) => {
          const enabled = categoryEntries.filter(([, p]) => p.enabled);
          const disabled = categoryEntries.filter(([, p]) => !p.enabled);

          return (
            <section key={category} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {getCategoryLabel(category)} {enabled.length}/{categoryEntries.length}
              </h2>

              <PresenceListSection
                entries={[...enabled, ...disabled]}
                onOpenMarketplace={onOpenMarketplace}
                onRemove={onRemove}
                onSchedule={onSchedule}
                onToggle={onToggle}
                showSchedule={showSchedule}
                updates={updates}
              />
            </section>
          );
        })}
      </div>
    </section>
  );
};