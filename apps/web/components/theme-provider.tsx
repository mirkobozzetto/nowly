"use client";

import type { FC, PropsWithChildren, ReactElement } from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

type Props = PropsWithChildren<ThemeProviderProps>;

export const ThemeProvider: FC<Props> = ({ children, ...props }): ReactElement => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};
