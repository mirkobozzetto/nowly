import { createHeadingId } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { Link } from "lucide-react";
import type { FC, ReactNode } from "react";

type HeadingAnchorProps = {
  as: "h1" | "h2" | "h3" | "h4";
  id?: string;
  children: ReactNode;
  className?: string;
};

export const HeadingAnchor: FC<HeadingAnchorProps> = ({ as: Tag, id, children, className }) => {
  const anchorId = id || createHeadingId(String(children));

  return (
    <Tag id={anchorId} className={cn("group relative scroll-mt-24", className)}>
      <a
        href={`#${anchorId}`}
        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Link to ${children}`}
      >
        <Link size={16} className="text-muted-foreground" />
      </a>
      {children}
    </Tag>
  );
};