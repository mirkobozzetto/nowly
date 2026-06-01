"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/data/platforms";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useCallback, useState } from "react";
import { StatRow } from "./stat-row";

type Props = {
  platform: Platform
  locale: string
  slug: string
  canRate?: boolean
};

export const StatsCard: FC<Props> = ({ platform, locale, slug, canRate }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const submitRating = useCallback(async (rating: number): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    setUserRating(rating);
    try {
      await fetch(`/api/p/${slug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } catch {
      setUserRating(0);
    } finally {
      setSubmitting(false);
    }
  }, [slug, submitting]);

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
              <span className="flex items-center gap-1 font-semibold">
                <Star className="w-4 h-4" fill={platform.iconColor} color={platform.iconColor} />
                {platform.rating}/5
              </span>
            </StatRow>

            {canRate && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">{t("yourRating")}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoveredStar || userRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        disabled={submitting}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => submitRating(star)}
                        className="p-0.5 transition-colors disabled:opacity-50"
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={cn("w-5 h-5 transition-colors", {
                            "text-foreground": filled,
                            "text-muted-foreground": !filled
                          })}
                          fill={filled ? platform.iconColor : "none"}
                        />
                      </button>
                    );
                  })}
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
