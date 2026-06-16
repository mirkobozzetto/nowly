"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import { useState } from "react";

export const SupportButton: FC = () => {
  const [thanked, setThanked] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const t = useTranslations("footer");

  const handleSupport = (): void => {
    if (thanked) return;

    setThanked(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          window.open("https://ko-fi.com/qkimi_", "_blank", "noopener,noreferrer");
          setTimeout(() => {
            setThanked(false);
            setCountdown(null);
          }, 500);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <Button
      onClick={handleSupport}
      size="sm"
      variant="secondary"
      className={cn(
        "text-muted-foreground text-xs sm:text-sm px-2 sm:px-3",
        thanked
          ? "border-red-500/50 text-foreground bg-red-500/10 pointer-events-none"
          : "hover:border-red-500/40 hover:text-foreground hover:bg-red-500/5",
      )}
    >
      <Heart className={cn("w-3.5 h-3.5 text-red-400 transition-transform", thanked && "scale-125")} fill="currentColor" />
      <span className="transition-all">{thanked ? t("thanks") : t("support")}</span>
      {countdown !== null && (
        <span className="text-xs text-dim-foreground">({t("redirect", { countdown })})</span>
      )}
    </Button>
  );
};