"use client";

import { usePathname } from "next/navigation";
import type { FC, ReactNode } from "react";

type SiteLayoutWrapperProps = {
  children: ReactNode;
};

export const SiteLayoutWrapper: FC<SiteLayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const isDocs = pathname.startsWith("/docs");

  if (isDocs) {
    return <>{children}</>;
  }

  return <>{children}</>;
};