"use client";

import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/l-ui/button";
import { KofiModal } from "@/components/ui/kofi-modal";
import { PROJECT_EXTENSION_DOWNLOAD_URL, PROJECT_EXTENSION_FILENAME } from "@/lib/constants";
import { CheckCircle, Crosshair, Download, Shield } from "lucide-react";

type BrowserType = "chrome" | "edge" | "firefox" | "safari" | "other";

const detectBrowser = (): BrowserType => {
  if (typeof window === "undefined") return "chrome";
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome") && !ua.includes("edg/")) return "chrome";
  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "safari";
  
  return "other";
};

const isChromiumBased = (browser: BrowserType): boolean => {
  return browser === "chrome" || browser === "edge";
};

export const CtaSection: FC = (): ReactElement => {
  const [browser, setBrowser] = useState<BrowserType>("chrome");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("CtaSection");

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  const isSupported = isChromiumBased(browser);
  const browserLabel = browser === "chrome"
    ? "Chrome"
    : browser === "edge"
      ? "Edge"
      : browser === "firefox"
        ? "Firefox"
        : browser === "safari"
          ? "Safari"
          : t("browser");

  const handleDownload = (): void => {
    if (!isSupported) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="download" className="py-24">
        <div className="max-w-[1200px] mx-auto px-6 relative z-[2]">
          <div className="bg-gradient-to-b from-card to-surface border border-border rounded-xl p-16 text-center">
            <h2 className="text-[2.5rem] font-extrabold tracking-tight mb-4">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("description")}
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              {isSupported ? (
                <Button
                  onClick={handleDownload}
                  variant="primary"
                >
                  <Download className="w-6 h-6" />
                  {t("downloadFor", { browser: browserLabel })}
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                >
                  <Download className="w-6 h-6" />
                  {t("comingSoon", { browser: browserLabel })}
                </Button>
              )}

              <a 
                href={PROJECT_EXTENSION_DOWNLOAD_URL}
                download={PROJECT_EXTENSION_FILENAME}
                className={buttonVariants({ variant: "secondary" })}
              >
                <Download className="w-6 h-6" />
                {t("extension")}
              </a>
            </div>

            <div className="flex justify-center gap-6 flex-wrap mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Crosshair className="w-4 h-4" />
                {t("platforms")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4" />
                {t("openSource")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle className="w-4 h-4" />
                {t("free")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
