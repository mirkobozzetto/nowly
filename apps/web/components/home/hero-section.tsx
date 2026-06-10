"use client";

import { KofiModal } from "@/components/l-ui/kofi-modal";
import { buttonVariants } from "@/components/ui/button";
import HighlightedText from "@/components/ui/highlighted-text";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { useState } from "react";
import { CompanionWindow } from "./companion-window";

export const HeroSection: FC = (): ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("HeroSection");

  return (
    <>
      <section className="min-h-screen flex items-center pt-[120px] pb-[60px] relative overflow-hidden border-b border-border">
        {/* <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(125% 125% at 80% 30%, transparent 45%, var(--accent) 100%)",
            opacity: 0.6,
          }}
        /> */}

        <div className="max-w-300 mx-auto px-6 relative z-2">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-center">
            {/* Content */}
            <div className="max-w-135 lg:max-w-none">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
                {t("badge")}
              </div>

              <h1 className="text-[clamp(3rem,5vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-6 bg-linear-to-br from-white to-muted-foreground bg-clip-text text-transparent">
                {t("title")}
                <br />
                <HighlightedText from="left" delay={0}>
                  {t("titleAccent")}
                </HighlightedText>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-[90%]">
                {t("description")}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/library" className={buttonVariants({ variant: "primary", size: "md" })}>
                  {t("cta")}
                  <ArrowRight className="h-4 w-4 ml-1" />
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