"use client";

import type { FC, ReactNode } from "react";
import { AdStatusProvider } from "./ad-status-provider";
import { QueryProvider } from "./query-provider";

type Props = {
  children: ReactNode;
};

export const Providers: FC<Props> = ({ children }) => {
  return (
    <QueryProvider>
      <AdStatusProvider>{children}</AdStatusProvider>
    </QueryProvider>
  );
};
