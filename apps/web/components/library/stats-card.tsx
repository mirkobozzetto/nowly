"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/data/platforms";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useCallback, useState } from "react";
import { StarDisplay } from "./star-display";
import { StatRow } from "./stat-row";

type Props = {
  platform: Platform
  locale: string
  slug: string
  canRate?: boolean
  savedRating?: number
};

const EXT_SOURCE = "Nowly";
let _msgId = 0;
const nextId = (): string => `r${_msgId++}_${Date.now()}`;

export const StatsCard: FC<Props> = ({ platform, locale, slug, canRate, savedRating }): ReactElement => {
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
          body: JSON.stringify({ rating }),
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
              <div className="space-y-1.5 pt-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = platform.ratingDistribution[stars] ?? 0;
                  const pct = platform.ratingCount > 0 ? (count / platform.ratingCount) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-8 text-xs text-muted-foreground tabular-nums">{stars}</span>
                      <div className="flex-1 h-2 bg-card-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: `${platform.iconColor}99` }}
                        />
                      </div>
                      <span className="w-6 text-xs text-dim-foreground tabular-nums text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {canRate && (
              <div className="bg-card-2 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">{t("yourRating")}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rated = userRating > 0;
                    const filled = rated ? star <= userRating : star <= (hoveredStar || userRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={submitting || rated}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => submitRating(star)}
                        className={cn(
                          "p-1 rounded-lg transition-all disabled:opacity-50",
                          filled
                            ? "scale-110"
                            : "text-dim-foreground hover:text-muted-foreground",
                        )}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <StarDisplay filled={filled} size="md" color={platform.iconColor} />
                      </button>
                    );
                  })}
                  {userRating > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {userRating}/5
                    </span>
                  )}
                </div>
              </div>
            )}
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
