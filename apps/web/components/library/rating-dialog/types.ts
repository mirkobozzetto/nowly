import type { ReactElement } from "react";

export type Props = {
  slug: string;
  iconColor: string;
  canRate: boolean;
  savedRating: number;
  onRate?: (rating: number) => void;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type RatingStarsProps = {
  rating: number;
  hoveredStar: number;
  iconColor: string;
  disabled: boolean;
  onRatingChange: (rating: number) => void;
  onHoveredStarChange: (rating: number) => void;
};

export type AuthRequiredProps = {
  onLogin: () => void;
  title: string;
  description1: string;
  description2: string;
  buttonLabel: string;
};

export type SubmittedStateProps = {
  message: string;
};

export type ConnectedUserCardProps = {
  user: {
    avatar?: string | null;
    avatar_url?: string | null;
    discordId?: string | null;
    globalName?: string | null;
    username?: string | null;
  } | null;
  anonymous: boolean;
  submitting: boolean;
  rating: number;
  connectedAsLabel: string;
  anonymousLabel: string;
  anonymousDescription: string;
  submitLabel: string;
  submittingLabel: string;
  logoutLabel: string;
  onSubmit: () => void;
  onLogout: () => void;
};
