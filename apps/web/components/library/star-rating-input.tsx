"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { StarDisplay } from "./star-display";

type Props = {
  iconColor: string
  canRate: boolean
  userRating: number
  hoveredStar: number
  submitting: boolean
  onRate: (rating: number) => void
  onHover: (star: number) => void
  onLeave: () => void
};

export const StarRatingInput: FC<Props> = ({
  iconColor,
  canRate,
  userRating,
  hoveredStar,
  submitting,
  onRate,
  onHover,
  onLeave,
}) => {
  const t = useTranslations("marketplace-detail");

  if (!canRate) return null;

  return (
    <div className="bg-card-2 border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-2">{t("your-rating")}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const rated = userRating > 0;
          const filled = rated ? star <= userRating : star <= (hoveredStar || userRating);
          return (
            <button
              key={star}
              type="button"
              disabled={submitting || rated}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={onLeave}
              onClick={() => onRate(star)}
              className={cn(
                "p-1 rounded-lg transition-all disabled:opacity-50",
                filled ? "scale-110" : "text-dim-foreground hover:text-muted-foreground",
              )}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <StarDisplay filled={filled} size="md" color={iconColor} />
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
  );
};
