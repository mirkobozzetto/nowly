import { ASSET_URL } from "@/lib/assets";
import type { Presence } from "@/lib/data/presences";
import Link from "next/link";
import type { FC } from "react";

type Props = {
  platform: Presence
};

export const PlatformLinkItem: FC<Props> = ({ platform }) => (
  <Link
    href={`/library/${platform.slug}`}
    className="bg-card border border-border rounded-lg p-5 text-center transition-all hover:border-muted-foreground hover:bg-card-hover hover:-translate-y-0.5 cursor-pointer"
  >
    <div className="w-9 h-9 mx-auto mb-3 flex items-center justify-center">
      <img
        src={ASSET_URL(platform.slug, "icon")}
        alt={platform.name}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
    <span className="font-semibold text-sm text-foreground">{platform.name}</span>
  </Link>
);