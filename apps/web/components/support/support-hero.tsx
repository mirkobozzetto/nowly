import type { FC, ReactElement } from "react";

type Props = {
  badge: string
  title: string
  description: string
};

export const SupportHero: FC<Props> = ({ badge, title, description }): ReactElement => {
  return (
    <div className="mb-12 min-w-0 py-12 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
        {badge}
      </div>

      <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
        {title}
      </h1>

      <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
        {description}
      </p>
    </div>
  );
};