import type { FC, ReactElement, ReactNode } from "react";

type Props = {
  action?: ReactNode;
  title: string;
};

export const SectionHeader: FC<Props> = ({ action, title }): ReactElement => (
  <div className="flex items-center justify-between">
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
    {action}
  </div>
);
