"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import { API_BASE_URL } from "@/lib/constants";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useCallback, useState } from "react";
import { RatingDistribution } from "./rating-distribution";
import { StarDisplay } from "./star-display";
import { StarRatingInput } from "./star-rating-input";
import { StatRow } from "./stat-row";

type Props = {
  platform: Presence
  locale: string
  slug: string
  canRate?: boolean
  savedRating?: number
  deviceId?: string | null
};

const EXT_SOURCE = "Nowly";
let _msgId = 0;
const nextId = (): string => `r${_msgId++}_${Date.now()}`;

export const StatsCard: FC<Props> = ({ platform, locale, slug, canRate, savedRating, deviceId }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const [userRating, setUserRating] = useState(savedRating ?? 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const submitRating = useCallback(async (rating: number): Promise<void> => {
    if (submitting || userRating > 0) return;
    setSubmitting(true);
    setUserRating(rating);
    try {
      await Promise.all([
        fetch(`${API_BASE_URL}/presences/${slug}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, deviceId }),
        }),
        window.postMessage(
          { source: EXT_SOURCE, type: "SAVE_USER_RATING", payload: { slug, rating }, messageId: nextId() },
          "*",
        ),
      ]);
    } catch {
      setUserRating(0);
    } finally {
      setSubmitting(false);
    }
  }, [slug, submitting, userRating]);

  const fullStars = Math.floor(platform.rating);
  const hasFraction = platform.rating - fullStars >= 0.5;

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
              </span>
            </StatRow>

            {platform.ratingCount > 0 && (
              <RatingDistribution
                distribution={platform.ratingDistribution}
                totalCount={platform.ratingCount}
                iconColor={platform.iconColor}
              />
            )}

            <StarRatingInput
              iconColor={platform.iconColor}
              canRate={!!canRate}
              userRating={userRating}
              hoveredStar={hoveredStar}
              submitting={submitting}
              onRate={submitRating}
              onHover={setHoveredStar}
              onLeave={() => setHoveredStar(0)}
            />
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