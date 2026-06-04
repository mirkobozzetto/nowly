import { PageLayout } from "@/components/layout/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { FC } from "react";

export const PresenceDetailSkeleton: FC = () => {
  return (
    <PageLayout>
      <div className="mx-auto max-w-300 px-6">
        <div className="mb-8 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
              <Skeleton className="h-44 w-full rounded-none" />

              <div className="relative z-10 px-6 pb-6 pt-28 space-y-4">
                <div className="flex items-start gap-6">
                  <Skeleton className="w-20 h-20 rounded-xl shrink-0" />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>

                <div className="pt-8 border-t border-border space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="rounded-2xl border border-border/80 bg-card shadow-sm p-6 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};