"use client";

import { Button } from "@/components/ui/button";
import { BadgeInfo, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC, type ReactElement } from "react";

const STORAGE_KEY = "nowly_adblock_notice_dismissed";
const DETECTION_DELAY_MS = 1800;

type Props = {
  enabled: boolean
};

const wasDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return true;
  }
};

const markDismissed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures; closing should still hide the notice for this page.
  }
};

const createAdBait = (): HTMLDivElement => {
  const bait = document.createElement("div");
  bait.className = "adsbox adsbygoogle ad-banner ad-placement advertisement pub_300x250 textads banner_ads";
  bait.setAttribute("aria-hidden", "true");
  bait.style.cssText = [
    "position:absolute",
    "left:-10000px",
    "top:-10000px",
    "width:1px",
    "height:1px",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(bait);
  return bait;
};

const isAdBaitBlocked = (bait: HTMLDivElement): boolean => {
  const styles = window.getComputedStyle(bait);

  return (
    bait.offsetHeight === 0 ||
    bait.clientHeight === 0 ||
    styles.display === "none" ||
    styles.visibility === "hidden"
  );
};

export const AdblockNotice: FC<Props> = ({ enabled }): ReactElement | null => {
  const t = useTranslations("ads");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || wasDismissed()) return;

    const bait = createAdBait();
    const timer = window.setTimeout(() => {
      const adsenseScript = document.querySelector<HTMLScriptElement>("script[src*='pagead2.googlesyndication.com']");
      const adsenseScriptBlocked = Boolean(adsenseScript && !window.adsbygoogle);

      if (isAdBaitBlocked(bait) || adsenseScriptBlocked) {
        setVisible(true);
      }

      bait.remove();
    }, DETECTION_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      bait.remove();
    };
  }, [enabled]);

  const dismiss = (): void => {
    markDismissed();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-24 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl shadow-black/30 backdrop-blur-sm sm:bottom-6"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="size-2.5 shrink-0 rounded-full bg-accent shadow-[0_0_16px_rgba(34,211,238,0.65)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("adblock-title")}</p>
          <p className="text-xs text-muted-foreground">{t("adblock-status")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label={t("adblock-close")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="rounded-xl border border-border bg-card-2 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BadgeInfo className="size-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">{t("adblock-message-title")}</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{t("adblock-message")}</p>
        </div>

        <Button variant="secondary" size="sm" onClick={dismiss} className="mt-3 w-full">
          {t("adblock-dismiss")}
        </Button>
      </div>
    </aside>
  );
};