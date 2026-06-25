"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, type FC, type ReactElement } from "react";

const STORAGE_KEY = "nowly_cookie_dismissed";

export const CookieBanner: FC = (): ReactElement | null => {
  const t = useTranslations("cookie-banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border border-border bg-background/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-300 flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {t("learn-more")}
          </Link>
        </p>

        <Button variant="default" size="sm" onClick={dismiss} className="shrink-0">
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
};
