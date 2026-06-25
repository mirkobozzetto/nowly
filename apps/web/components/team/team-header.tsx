import type { FC, ReactElement } from "react";

type Props = {
  badge: string
  title: string
  description: string
};

export const TeamHeader: FC<Props> = ({ badge, title, description }): ReactElement => {
  return (
    <div className="mb-12 min-w-0 py-8 text-center">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
        {badge}
      </div>

      <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
        {title}
      </h1>

      <p className="mx-auto max-w-xl text-balance text-muted-foreground">
        {description}
      </p>
    </div>
  );
};