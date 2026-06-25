import { Skeleton } from "@/components/ui/skeleton";
import type { FC } from "react";

const CARD_COUNT = 9;

export const MarketplaceGridSkeleton: FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
          <Skeleton className="h-28 w-full rounded-none" />

          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-lg shrink-0" />

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>

                <Skeleton className="h-8 w-full" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};