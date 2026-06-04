import { PageLayout } from "@/components/layout/page-layout";
import { MarketplaceGridSkeleton } from "@/components/library/marketplace-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { FC } from "react";

const Loading: FC = () => {
  return (
    <PageLayout>
      <div className="max-w-300 mx-auto px-6">
        <div className="text-center max-w-150 mx-auto mb-12">
          <Skeleton className="h-3 w-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-10 w-96 rounded-lg mx-auto mb-4" />
          <Skeleton className="h-5 w-72 rounded-md mx-auto" />
        </div>

        <div className="relative mb-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>

          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        <Skeleton className="h-4 w-32 rounded-md mb-6" />

        <MarketplaceGridSkeleton />
      </div>
    </PageLayout>
  );
};

export default Loading;