import { ASSET_URL } from "@/lib/assets";
import type { Presence } from "@/lib/data/presences";
import Link from "next/link";
import type { FC } from "react";

type Props = {
  presence: Presence
};

export const PresenceLinkItem: FC<Props> = ({ presence }) => (
  <Link
    href={`/library/${presence.slug}`}
    className="bg-card border border-border rounded-lg p-5 text-center transition-all hover:border-muted-foreground hover:bg-card-hover hover:-translate-y-0.5 cursor-pointer"
  >
    <div className="w-9 h-9 mx-auto mb-3 flex items-center justify-center">
      <img
        src={ASSET_URL(presence.slug, "icon")}
        alt={presence.name}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
    <span className="font-semibold text-sm text-foreground">{presence.name}</span>
  </Link>
);