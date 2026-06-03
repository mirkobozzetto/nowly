"use client";

import { buttonVariants } from "@/components/l-ui/button";
import { PROJECT_REPOSITORY_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { FooterLinks } from "./footer-links";
import { LocaleSelector } from "./locale-selector";
import { SupportButton } from "./support-button";

export const Footer: FC = (): ReactElement => {
  const t = useTranslations("Footer");

  return (
    <footer className="py-8 border-t border-border text-dim-foreground text-sm">
      <div className="max-w-300 mx-auto px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-4">
                <img
                  src="https://avatars.githubusercontent.com/u/51194216?v=4"
                  alt={t("authorAlt")}
                  className="w-10 h-10 rounded-full border-2 border-background object-cover shrink-0 relative z-2"
                />

                <img
                  src="https://avatars.githubusercontent.com/steellgold?v=4"
                  alt="steellgold"
                  className="w-10 h-10 rounded-full border-2 border-background object-cover shrink-0 relative z-1"
                />
              </div>
              <div className="text-left">
                <p className="text-muted-foreground">{t("copyright")}</p>
                <small className="opacity-60 text-xs">
                  {t("trademark")}{" "}
                  <a
                    href="https://discord.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Discord Inc
                  </a>
                  .
                </small>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SupportButton />

              <a
                href={PROJECT_REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className: "text-muted-foreground hover:border-zinc-500/40 hover:text-foreground hover:bg-zinc-500/10",
                  size: "sm",
                  variant: "secondary",
                })}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {t("openSource")}
              </a>
            </div>
          </div>

          <FooterLinks />

          <LocaleSelector />
        </div>
      </div>
    </footer>
  );
};
