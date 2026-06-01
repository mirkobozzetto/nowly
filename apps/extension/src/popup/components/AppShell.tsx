import type { FC, ReactElement, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const AppShell: FC<Props> = ({ children }): ReactElement => (
  <main className="w-[420px] min-h-[600px] bg-background text-foreground">
    <div className="flex min-h-[600px] flex-col gap-4 p-4">{children}</div>
  </main>
);
