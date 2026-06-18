"use client";

import { Card, CardTitle } from "@/components/ui/card";
import type { Presence } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Presence
};

export const InstallVersionsCard: FC<Props> = ({
  platform,
}): ReactElement | null => {
  const t = useTranslations("marketplace-detail");

  if (platform.status === "available" || platform.status === "beta") return null;

  return (
    <Card size="sm" className="bg-linear-to-b from-card to-surface">
      <CardTitle className="text-foreground normal-case tracking-normal">{t("installation")}</CardTitle>
      
      <p className="text-sm text-muted-foreground leading-relaxed">{t("coming-soon-description", { platform: platform.name })}</p>
    </Card>
  );
};