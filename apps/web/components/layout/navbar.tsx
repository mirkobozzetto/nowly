"use client";

import { buttonVariants } from "@/components/l-ui/button";
import { buttonVariants as _buttonVariants } from "@/components/ui/button";
import { useBrowser } from "@/hooks/use-browser";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";

export const Navbar: FC = (): ReactElement => {
  const [scrolled, setScrolled] = useState(false);
  const browser = useBrowser();
  const locale = useLocale();
  const t = useTranslations("Navbar");

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        scrolled && "bg-background/90 backdrop-blur-xl"
      )}
    >
      <div className="max-w-300 mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`}>
            <img src="/app_title_white.png" alt="Nowly" className="h-8 w-auto" />
          </Link>
          
          <div className="flex items-center gap-3">
            <Link
               href={`/${locale}/library`}
              className={_buttonVariants({ variant: "link" })}
            >
              {t("marketplace")}
            </Link>

            <Link
              href="#download"
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
