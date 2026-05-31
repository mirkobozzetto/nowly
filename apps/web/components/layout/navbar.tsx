"use client";

import { buttonVariants } from "@/components/l-ui/button";
import { cn } from "@/lib/utils";
import { Download, Radio } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";

export const Navbar: FC = (): ReactElement => {
  const [scrolled, setScrolled] = useState(false);
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
          <Link href={`/${locale}`} className="flex items-center gap-2.5 font-bold text-base">
            <Radio className="w-6 h-6 text-accent" />

            Presence<span className="text-muted-foreground">Discord</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/marketplace`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              {t("marketplace")}
            </Link>

            <Link
              href="#download"
              className={buttonVariants({ size: "md", variant: "accent" })}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t("downloadDesktop")}</span>
              <span className="sm:hidden">{t("downloadShort")}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
