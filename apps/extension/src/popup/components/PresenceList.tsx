import type { FC, ReactElement } from "react";
import { t } from "../../shared/i18n";
import type { InstalledPresences, PresenceMetadata } from "../../shared/types";
import { EmptyState } from "./EmptyState";
import { MarketplaceLink } from "./MarketplaceLink";
import { PresenceListItem } from "./PresenceListItem";

type Props = {
  entries: Array<[string, InstalledPresences[string]]>;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
};

type Category = PresenceMetadata["category"];

const categoryLabels: Record<Category, string> = {
  anime: "Anime",
  music: "Musique",
  other: "Autre",
  streaming: "Streaming",
  tv: "TV",
};

const groupByCategory = (entries: Props["entries"]): Array<[Category, Props["entries"]]> => {
  const groups = new Map<Category, Props["entries"]>();

  for (const entry of entries) {
    const [, presence] = entry;
    const category = presence.metadata.category;
    groups.set(category, [...(groups.get(category) ?? []), entry]);
  }

  return Array.from(groups.entries()).sort(([left], [right]) =>
    categoryLabels[left].localeCompare(categoryLabels[right]),
  );
};

export const PresenceList: FC<Props> = ({ entries, onRemove, onToggle }): ReactElement => {
  const groups = groupByCategory(entries);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-end">
        <MarketplaceLink />
      </div>

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {groups.map(([category, categoryEntries]) => (
            <section key={category} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {categoryLabels[category]}
              </h2>

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {categoryEntries.map(([slug, presence]) => (
                  <PresenceListItem
                    key={slug}
                    slug={slug}
                    presence={presence}
                    onToggle={onToggle}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
};
