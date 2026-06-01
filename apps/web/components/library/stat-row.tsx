import type { FC, ReactNode } from "react";

type Props = {
  label: string
  value?: string
  children?: ReactNode
};

export const StatRow: FC<Props> = ({ label, value, children }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    {children ?? <span className="font-semibold">{value}</span>}
  </div>
);
