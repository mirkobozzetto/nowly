"use client";

import { KofiModal } from "@/components/l-ui/kofi-modal";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import type { FC, ReactElement } from "react";
import { useState } from "react";

export const CtaSection: FC = (): ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("CtaSection");

  const handleDownload = (): void => {
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="download" className="py-24">
        <div className="max-w-300 mx-auto px-6 relative z-2">
          <div className="bg-linear-to-b from-card to-surface border border-border rounded-xl p-16 text-center">
            <h2 className="text-[2.5rem] font-extrabold tracking-tight mb-4">
              {t("title")}
            </h2>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("description")}
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={handleDownload} variant="primary" size="lg">
                <Download className="w-6 h-6" />
                {t("downloadFor", { browser: "Chrome" })}
              </Button>

              <Button disabled variant="secondary" size="lg">
                <img
                  src="https://thesvg.org/icons/firefox/default.svg"
                  alt="Firefox"
                  className="w-4 h-4"
                />

                Firefox

                <span className="ml-2 text-xs text-muted rounded-sm px-1.5 py-0.5 bg-muted-foreground border border-muted">
                  {t("comingSoon")}
                </span>
              </Button>
            </div>

            <div className="flex justify-center gap-6 flex-wrap mt-8">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <img
                  src="https://thesvg.org/icons/chromium/default.svg"
                  alt="Chromium"
                  className="w-4 h-4"
                />
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