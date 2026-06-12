"use client";

import { KofiModal } from "@/components/l-ui/kofi-modal";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Monitor, Shield } from "lucide-react";
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
          {/* Desktop CTA */}
          <div className="hidden md:block bg-linear-to-b from-card to-surface border border-border rounded-xl p-8 md:p-16 text-center">
            <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight mb-4">
              {t("title")}
            </h2>

            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("description")}
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap items-stretch">
              <Button onClick={handleDownload} variant="primary" size="lg">
                <Download className="w-5 h-5" />
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
                  {t("firefoxStatus")}
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

          {/* Mobile: desktop-only overlay */}
          <div className="md:hidden relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-linear-to-b from-card to-surface opacity-30" />
            <div className="absolute inset-0 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center justify-center px-8 py-24 text-center">
              <Monitor className="w-16 h-16 text-accent mb-6" />
              <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">
                Version desktop uniquement
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                L'extension Nowly est conçue pour les navigateurs de bureau. Pour profiter de Discord Rich Presence, installe-la sur ton PC.
              </p>
            </div>
          </div>
        </div>
      </section>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};