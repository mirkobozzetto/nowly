import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Contributor } from "@/lib/data/platforms"
import type { FC, ReactElement } from "react"

type Props = {
  contributor: Contributor
  label?: string
}

export const AuthorItem: FC<Props> = ({ contributor, label }): ReactElement => (
  <a
    href={contributor.github ? `https://github.com/${contributor.github}` : undefined}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 bg-card-2 hover:bg-card-hover px-3 py-2 transition-colors first:rounded-t-lg last:rounded-b-lg"
  >
    <Avatar className="h-8 w-8 shrink-0">
      {contributor.avatar ? (
        <AvatarImage src={contributor.avatar} alt={contributor.name} />
      ) : null}
      <AvatarFallback>{contributor.name.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
    <span className="text-sm text-foreground flex-1">{contributor.name}</span>
    {label && (
      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-dim-foreground">
        {label}
      </span>
    )}
  </a>
)
