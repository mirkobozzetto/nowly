"use client";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/constants";
import { EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { presenceKey } from "@/hooks/use-presence";
import { useQueryClient } from "@tanstack/react-query";
import { StarDisplay } from "./star-display";

type CommentEntry = {
  id: string
  rating: number
  comment?: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  anonymous?: boolean
  createdAt: string
  isOwn?: boolean
};

type Props = {
  slug: string
  iconColor: string
  locale: string
};

export const CommentsCard: FC<Props> = ({
  slug,
  iconColor,
  locale,
}): ReactElement => {
  const t = useTranslations("marketplace-detail");
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem("nowly_discord_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/presences/${slug}/comments`, { headers });
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [slug]);

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const token = localStorage.getItem("nowly_discord_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/presences/${slug}/comments`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        queryClient.invalidateQueries({ queryKey: presenceKey(slug) });
        toast.success(t("comment-deleted"));
      } else {
        toast.error(t("rate-error"));
      }
    } catch {
      toast.error(t("rate-error"));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card-2 border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="size-3" />
                ))}
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <Empty>
        <EmptyDescription>{t("comments-empty")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {t("comments-count", { count: comments.length })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-card-2 border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarDisplay
                    key={i}
                    filled={i <= comment.rating}
                    size="sm"
                    color={iconColor}
                  />
                ))}
              </div>
              <span className="text-xs text-dim-foreground">
                {dateFormatter.format(new Date(comment.createdAt))}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {comment.anonymous ? (
                <>
                  <div className="flex size-5 items-center justify-center rounded-full border border-border bg-card-hover text-muted-foreground">
                    <EyeOffIcon className="size-3" />
                  </div>
                  <span className="text-xs text-muted-foreground">{t("comment-anonymous")}</span>
                </>
              ) : (
                <>
                  {comment.authorAvatar && (
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName ?? ""}
                      className="size-5 rounded-full"
                    />
                  )}
                  {comment.authorName && (
                    <span className="text-xs font-medium text-foreground">
                      {comment.authorName}
                    </span>
                  )}
                </>
              )}
            </div>

            {comment.comment && (
              <p className="text-sm text-foreground leading-relaxed">{comment.comment}</p>
            )}

            {comment.isOwn && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={deletingId === comment.id}
                  onClick={() => handleDelete(comment.id)}
                >
                  {deletingId === comment.id ? t("rate-submitting") : t("comment-delete")}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
