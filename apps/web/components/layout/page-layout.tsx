import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const PageLayout: FC<Props> = ({ children }) => {
  return <main className="pt-24 pb-16">{children}</main>;
};

export { PageLayout };
