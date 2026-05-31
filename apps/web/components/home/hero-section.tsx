"use client";

import { KofiModal } from "@/components/ui/kofi-modal";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useState } from "react";
import { CompanionWindow } from "./companion-window";

// type BrowserType = "chrome" | "edge" | "firefox" | "safari" | "other";

// const detectBrowser = (): BrowserType => {
//   if (typeof window === "undefined") return "chrome";
  
//   const ua = navigator.userAgent.toLowerCase();
  
//   if (ua.includes("edg/")) return "edge";
//   if (ua.includes("chrome") && !ua.includes("edg/")) return "chrome";
//   if (ua.includes("firefox")) return "firefox";
//   if (ua.includes("safari") && !ua.includes("chrome")) return "safari";
  
//   return "other";
// };

// const isChromiumBased = (browser: BrowserType): boolean => {
//   return browser === "chrome" || browser === "edge";
// };

export const HeroSection: FC = (): ReactElement => {
  // const [browser, setBrowser] = useState<BrowserType>("chrome");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("HeroSection");

  // useEffect(() => {
  //   setBrowser(detectBrowser());
  // }, []);

  // const isSupported = isChromiumBased(browser);

  // const handleDownload = (): void => {
  //   if (!isSupported) return;
  //   setIsModalOpen(true);
  // };

  return (
    <>
      <section className="min-h-screen flex items-center py-[120px_0_60px] relative overflow-hidden">
        <div className="max-w-300 mx-auto px-6 relative z-2">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-center">
            {/* Content */}
            <div className="max-w-135 lg:max-w-none">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
                {t("badge")}
              </div>
              
              <h1 className="text-[clamp(3rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-6 bg-linear-to-br from-white to-muted-foreground bg-clip-text text-transparent">
                {t("title")}<br/>
                <span className="text-accent">{t("titleAccent")}</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-[90%]">
                {t("description")}
              </p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href={`/${locale}/marketplace`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-[15px] bg-card-2 text-foreground border border-border hover:border-muted-foreground hover:bg-card-hover transition-all"
                >
                  {t("cta")}
                </Link>
              </div>
            </div>
            
            {/* Visual */}
            <div className="hidden lg:block">
              <CompanionWindow />
            </div>
          </div>
        </div>
      </section>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
