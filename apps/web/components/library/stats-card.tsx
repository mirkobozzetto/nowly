"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { useUser } from "@/lib/use-user";
import { presenceKey } from "@/hooks/use-presence";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { ConnectDialog, RatingDialog } from "./rating-dialog";
import { StarDisplay } from "./star-display";
import { StatRow } from "./stat-row";

type Props = {
  platform: Presence
  locale: string
  slug: string
  canRate?: boolean
  savedRating?: number
};

export const StatsCard: FC<Props> = ({ platform, locale, slug, canRate, savedRating }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const { isAuthenticated, token, login } = useUser();
  const queryClient = useQueryClient();
  const [localRating, setLocalRating] = useState(savedRating ?? 0);
  const [deleting, setDeleting] = useState(false);

  const myRatingKey = ["my-rating", slug] as const;

  const { data: myRating } = useQuery<{ rated: boolean; rating: number; hasComment: boolean } | null>({
    queryKey: myRatingKey,
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}/presences/${slug}/my-rating`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fullStars = Math.floor(platform.rating);
  const hasFraction = platform.rating - fullStars >= 0.5;

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/presences/${slug}/comments`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLocalRating(0);
        queryClient.invalidateQueries({ queryKey: presenceKey(slug) });
        queryClient.invalidateQueries({ queryKey: myRatingKey });
        toast.success(t("commentDeleted"));
      } else {
        toast.error(t("rateError"));
      }
    } catch {
      toast.error(t("rateError"));
    } finally {
      setDeleting(false);
    }
  };

  const isRated = localRating > 0 || myRating?.rated;
  const hasComment = myRating?.hasComment;

  const actionLabel = !isRated
    ? t("rateAction")
    : isRated && !hasComment
      ? t("rateComment")
      : t("rateModify");

  const actionRating = isRated ? (myRating?.rating ?? localRating) : 0;

  return (
    <Card size="sm">
      <CardTitle className="text-foreground normal-case tracking-normal">{t("stats")}</CardTitle>
      <div className="space-y-4">
        {platform.status !== "soon" && (
          <>
            <StatRow
              label={t("activeUsers")}
              value={platform.activeUsers.toLocaleString()}
            />

            <StatRow
              label={t("totalInstalls")}
              value={platform.totalInstalls.toLocaleString()}
            />

            <StatRow label={t("rating")}>
              <span className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarDisplay
                      key={i}
                      filled={i <= fullStars || (i === fullStars + 1 && hasFraction)}
                      color={platform.iconColor}
                    />
                  ))}
                </span>

                <span className="font-semibold text-sm">{platform.rating}</span>

                {canRate && (
                  <span className="flex items-center gap-1">
                    {isAuthenticated ? (
                      <RatingDialog
                        slug={slug}
                        iconColor={platform.iconColor}
                        canRate={true}
                        savedRating={actionRating}
                        onRate={(r) => {
                          setLocalRating(r);
                          queryClient.invalidateQueries({ queryKey: myRatingKey });
                        }}
                        trigger={
                          <Button variant="outline" size="xs">
                            {actionLabel}
                          </Button>
                        }
                      />
                    ) : (
                      <ConnectDialog
                        onLogin={login}
                        trigger={
                          <Button variant="outline" size="xs">
                            {t("rateAction")}
                          </Button>
                        }
                      />
                    )}
                    {isAuthenticated && isRated && hasComment && (
                      <Button variant="destructive" size="xs" disabled={deleting} onClick={handleDelete}>
                        {deleting ? t("rateSubmitting") : t("commentDelete")}
                      </Button>
                    )}
                  </span>
                )}
              </span>
            </StatRow>
          </>
        )}

        <StatRow
          label={t("addedAt")}
          value={dateFormatter.format(new Date(platform.addedAt))}
        />

        <StatRow
          label={t("lastUpdated")}
          value={dateFormatter.format(new Date(platform.lastUpdated))}
        />
      </div>
    </Card>
  );
};
