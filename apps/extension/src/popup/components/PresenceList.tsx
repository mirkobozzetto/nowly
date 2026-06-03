import type { FC, ReactElement } from "react";
import type { InstalledPresences, PresenceDisplayMode, PresenceMetadata } from "@/shared/types";
import { EmptyState } from "./EmptyState";
import { PresenceListItem } from "./PresenceListItem";

type Props = {
  activeSlug: string | null;
  displayMode: PresenceDisplayMode;
  entries: Array<[string, InstalledPresences[string]]>;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  separateActive: boolean;
  updates: Record<string, string>;
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

const sortAlphabetically = (entries: Props["entries"]): Props["entries"] =>
  [...entries].sort(([, a], [, b]) => a.metadata.name.localeCompare(b.metadata.name));

export const PresenceList: FC<Props> = ({
  activeSlug,
  displayMode,
  entries,
  onOpenMarketplace,
  onRemove,
  onToggle,
  separateActive,
  updates,
}): ReactElement => {
  const filtered = separateActive && activeSlug
    ? entries.filter(([slug]) => slug !== activeSlug)
    : entries;

  if (filtered.length === 0) return <EmptyState />;

  if (displayMode === "alphabetical") {
    const sorted = sortAlphabetically(filtered);
    return (
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {sorted.map(([slug, presence]: [string, InstalledPresences[string]]) => (
              <PresenceListItem
                key={slug}
                slug={slug}
                presence={presence}
                onToggle={onToggle}
                onRemove={onRemove}
                onOpenMarketplace={onOpenMarketplace}
                updateAvailable={updates[slug]}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const groups = groupByCategory(filtered);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {groups.map(([category, categoryEntries]) => {
          const total = categoryEntries.length;
          const active = categoryEntries.filter(([, p]) => p.enabled).length;
          return (
            <section key={category} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {categoryLabels[category]} {active}/{total}
              </h2>

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {categoryEntries.map(([slug, presence]) => (
                  <PresenceListItem
                    key={slug}
                    slug={slug}
                    presence={presence}
                    onToggle={onToggle}
                    onRemove={onRemove}
                    onOpenMarketplace={onOpenMarketplace}
                    updateAvailable={updates[slug]}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
};
