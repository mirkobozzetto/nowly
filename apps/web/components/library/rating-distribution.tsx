import type { FC } from "react";

type Props = {
  distribution: Record<number, number>
  totalCount: number
  iconColor: string
};

export const RatingDistribution: FC<Props> = ({ distribution, totalCount, iconColor }) => (
  <div className="space-y-1.5 pt-1">
    {[5, 4, 3, 2, 1].map((stars) => {
      const count = distribution[stars] ?? 0;
      const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
      return (
        <div key={stars} className="flex items-center gap-2">
          <span className="w-8 text-xs text-muted-foreground tabular-nums">{stars}</span>
          <div className="flex-1 h-2 bg-card-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: `${iconColor}99` }}
            />
          </div>
          <span className="w-6 text-xs text-dim-foreground tabular-nums text-right">{count}</span>
        </div>
      );
    })}
  </div>
);
