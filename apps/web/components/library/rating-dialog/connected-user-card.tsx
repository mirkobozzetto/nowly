"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EyeOffIcon } from "lucide-react";
import type { FC, ReactElement } from "react";
import type { ConnectedUserCardProps } from "./types";

export const ConnectedUserCard: FC<ConnectedUserCardProps> = ({
  user,
  anonymous,
  submitting,
  rating,
  connectedAsLabel,
  anonymousLabel,
  anonymousDescription,
  submitLabel,
  submittingLabel,
  logoutLabel,
  onSubmit,
  onLogout,
}): ReactElement => {
  const avatarUrl = user?.avatar_url ?? "https://cdn.discordapp.com/embed/avatars/0.png";

  const realDisplayName = user?.globalName || user?.username || "Discord user";
  const displayName = anonymous ? anonymousLabel : realDisplayName;
  const fallback = realDisplayName.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-card-2/60 p-3 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
          <Avatar
            size="lg"
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-out",
              anonymous && "scale-90 opacity-0 blur-sm"
            )}
          >
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full",
              "border border-border bg-card-hover text-muted-foreground",
              "transition-all duration-300 ease-out",
              anonymous ? "scale-100 opacity-100 blur-0" : "scale-90 opacity-0 blur-sm"
            )}
          >
            <EyeOffIcon className="size-4" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight transition-colors duration-300",
              anonymous ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {displayName}
          </p>

          <p className="text-xs text-muted-foreground transition-all duration-300">
            {anonymous ? anonymousDescription : connectedAsLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="default"
          size="default"
          disabled={rating === 0 || submitting}
          onClick={onSubmit}
        >
          {submitting ? submittingLabel : submitLabel}
        </Button>

        <Button
          variant="destructive"
          size="default"
          onClick={onLogout}
          disabled={submitting}
        >
          {logoutLabel}
        </Button>
      </div>
    </div>
  );
};
