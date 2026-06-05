"use client";

import { cn } from "@/lib/utils";
import type { FC, ReactElement } from "react";
import { StarDisplay } from "../star-display";
import type { RatingStarsProps } from "./types";

export const RatingStars: FC<RatingStarsProps> = ({
  rating,
  hoveredStar,
  iconColor,
  disabled,
  onRatingChange,
  onHoveredStarChange,
}): ReactElement => (
  <div className="flex flex-col items-center gap-3">
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoveredStar || rating);

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => onHoveredStarChange(star)}
            onMouseLeave={() => onHoveredStarChange(0)}
            onClick={() => onRatingChange(rating === star ? 0 : star)}
            className={cn(
              "rounded-xl p-2 transition-all",
              "hover:bg-card-2",
              "disabled:pointer-events-none disabled:opacity-50",
              filled
                ? "scale-110"
                : "text-dim-foreground hover:text-muted-foreground"
            )}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <StarDisplay filled={filled} size="md" color={iconColor} />
          </button>
        );
      })}
    </div>
  </div>
);
