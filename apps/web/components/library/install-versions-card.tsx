"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import type { Platform } from "@/lib/data/platforms";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Platform
};

export const InstallVersionsCard: FC<Props> = ({
  platform,
}): ReactElement | null => {
  const t = useTranslations("MarketplaceDetail");

  if (platform.status === "available" || platform.status === "beta") return null;

  return (
    <Card size="sm" className="bg-linear-to-b from-card to-surface">
      <CardTitle className="text-foreground normal-case tracking-normal">{t("installation")}</CardTitle>
      <p className="text-sm text-muted-foreground leading-relaxed">{t("comingSoonDescription", { platform: platform.name })}</p>
    </Card>
  );
};
