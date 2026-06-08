"use client";

import { buttonVariants as _buttonVariants, buttonVariants } from "@/components/ui/button";
import { useBrowser } from "@/hooks/use-browser";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
// import { useEffect, useState } from "react";

export const Navbar: FC = (): ReactElement => {
  const browser = useBrowser();
  const t = useTranslations("Navbar");

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        "bg-background/35 backdrop-blur-xl"
      )}
    >
      <div className="max-w-300 mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <img src="/app_title_white.png" alt="Nowly" className="h-8 w-auto" />
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/library"
              className={_buttonVariants({ size: "md", variant: "link" })}
            >
              {t("marketplace")}
            </Link>

            <Link
              href="/#download"
              className={buttonVariants({ size: "md", variant: "accent" })}
            >
              <Download size={16} />

              <span className="hidden sm:inline">
                {browser ? t("downloadFor", { browser }) : t("downloadDesktop")}
              </span>
              <span className="sm:hidden">{browser || t("downloadShort")}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};