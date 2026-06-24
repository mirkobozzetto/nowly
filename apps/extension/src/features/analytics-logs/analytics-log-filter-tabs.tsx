import { Button } from "@/components/ui/button";
import type { FC } from "react";
import { filters, type AnalyticsLogFilter } from "@/features/analytics-logs/analytics-logs.model";

type Props = {
  filter: AnalyticsLogFilter;
  onFilterChange: (filter: AnalyticsLogFilter) => void;
};

export const AnalyticsLogFilterTabs: FC<Props> = ({ filter, onFilterChange }) => (
  <div role="tablist" className="flex gap-1 overflow-x-auto">
    {filters.map((item) => (
      <Button
        key={item}
        role="tab"
        aria-selected={filter === item}
        variant="unstyled"
        size="none"
        onClick={() => onFilterChange(item)}
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
);