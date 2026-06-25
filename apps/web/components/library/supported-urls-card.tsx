"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  urls: string[]
};

export const SupportedUrlsCard: FC<Props> = ({ urls }): ReactElement => {
  const t = useTranslations("marketplace-detail");

  return (
    <Card>
      <CardTitle>{t("supported-urls")}</CardTitle>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card-2 text-sm text-muted-foreground border border-border font-mono"
          >
            {url}
          </span>
        ))}
      </div>
    </Card>
  );
};
