"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";

const NotFound = (): ReactElement => {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <svg className="w-16 h-16 mx-auto text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-4">404</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg font-semibold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
