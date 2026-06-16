"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogMedia, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { presenceKey } from "@/hooks/use-presence";
import { useQueryClient } from "@tanstack/react-query";
import { EXT_SOURCE, nextId } from "../presence-detail/utils";
import { ConnectedUserCard } from "./connected-user-card";
import { RatingStars } from "./rating-stars";
import { SubmittedState } from "./submitted-state";
import type { Props } from "./types";

export const RatingDialog: FC<Props> = ({
  slug,
  iconColor,
  canRate,
  savedRating,
  onRate,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}): ReactElement | null => {
  const t = useTranslations("marketplace-detail");
  const { user, logout } = useUser();
  const queryClient = useQueryClient();

  const [internalOpen, setInternalOpen] = useState(false);
  const [rating, setRating] = useState(savedRating || 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const resetForm = useCallback((): void => {
    setRating(savedRating || 0);
    setHoveredStar(0);
    setComment("");
    setAnonymous(false);
    setSubmitting(false);
    setSubmitted(false);
  }, [savedRating]);

  const handleOpenChange = useCallback(
    (newOpen: boolean): void => {
      setOpen(newOpen);

      if (!newOpen) {
        resetForm();
      }
    },
    [resetForm, setOpen]
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (submitting || rating === 0) return;

    setSubmitting(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const stored = localStorage.getItem("nowly_discord_token");

      if (stored) {
        headers.Authorization = `Bearer ${stored}`;
      }

      const response = await fetch(`${API_BASE_URL}/presences/${slug}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          anonymous,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      window.postMessage(
        {
          source: EXT_SOURCE,
          type: "SAVE_USER_RATING",
          payload: {
            slug,
            rating,
          },
          messageId: nextId(),
        },
        "*"
      );

      setSubmitted(true);
      onRate?.(rating);
      queryClient.invalidateQueries({ queryKey: presenceKey(slug) });
      toast.success(t("rate-thanks"));
    } catch {
      setRating(savedRating || 0);
      toast.error(t("rate-error"));
    } finally {
      setSubmitting(false);
    }
  }, [anonymous, comment, onRate, queryClient, rating, savedRating, slug, submitting, t]);

  if (!canRate) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full">
            {t("rate-action")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent size="default">
        {submitted ? (
          <SubmittedState message={t("rate-thanks")} />
        ) : (
          <>
            <DialogHeader>
              <DialogMedia>
                <StarIcon className="size-5" />
              </DialogMedia>

              <DialogTitle>{t("rate-title")}</DialogTitle>

              <DialogDescription>{t("rate-review-desc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-6">
            <RatingStars
              rating={rating}
              hoveredStar={hoveredStar}
              iconColor={iconColor}
              disabled={submitting}
              onRatingChange={setRating}
              onHoveredStarChange={setHoveredStar}
            />

            <Textarea
              placeholder={t("rate-placeholder")}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={submitting}
              className="min-h-24"
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card-2/40 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card-2">
              <Checkbox
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
                disabled={submitting}
              />
              {t("rate-anonymous")}
            </label>

            <ConnectedUserCard
              user={user}
              anonymous={anonymous}
              submitting={submitting}
              rating={rating}
              connectedAsLabel={t("connected-as")}
              anonymousLabel="Anonymous"
              anonymousDescription="Your identity will be hidden"
              submitLabel={t("rate-submit")}
              submittingLabel={t("rate-submitting")}
              logoutLabel={t("logout")}
              onSubmit={handleSubmit}
              onLogout={logout}
            />
          </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
