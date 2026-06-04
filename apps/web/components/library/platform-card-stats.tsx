import type { Presence } from "@/lib/data/presences";
import { Download, Star, Users } from "lucide-react";
import type { FC } from "react";

type Props = {
  platform: Presence
};

export const PlatformCardStats: FC<Props> = ({ platform }) => {
  if (platform.status !== "available") return null;

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Download className="w-3.5 h-3.5" />
        {platform.totalInstalls.toLocaleString()}
      </span>

      <span className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {platform.activeUsers.toLocaleString()}
      </span>

      <span className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5" fill={platform.iconColor} color={platform.iconColor} />
        {platform.rating}
      </span>
    </div>
  );
};