"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import type { Contributor } from "@/lib/data/platforms";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { AuthorItem } from "./author-item";

type Props = {
  author: Contributor
  contributors: Contributor[]
  sourceUrl?: string
};

export const DevelopmentCard: FC<Props> = ({ author, contributors, sourceUrl }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");

  return (
    <Card size="sm">
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="flex items-center gap-1.5 text-foreground normal-case tracking-normal">{t("development")}</CardTitle>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-dim-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {t("source")}
          </a>
        )}
      </div>
      <AuthorItem
        contributor={author}
        label={contributors.length > 0 ? t("authorLabel") : undefined}
      />
      {contributors.length > 0 && contributors.map((contributor, index) => (
        <AuthorItem key={index} contributor={contributor} label={t("contributorLabel")} />
      ))}
    </Card>
  );
};
