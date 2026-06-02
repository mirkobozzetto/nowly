"use client";

import { Card, CardTitle } from "@/components/l-ui/card";
import { API_BASE_URL } from "@/lib/constants";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";

interface VersionEntry {
  version: string
  changelog: string
  author: string
  authorGithub?: string
  pr?: string
  timestamp: number
}

type Props = {
  slug: string
  locale: string
};

export const VersionHistoryCard: FC<Props> = ({ slug, locale }): ReactElement => {
  const t = useTranslations("MarketplaceDetail");
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/presences/${slug}/versions`, { cache: "no-store" })
      .then((r) => r.json() as Promise<VersionEntry[]>)
      .then((data) => { setVersions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading || versions.length === 0) return <></>;

  const displayed = showAll ? versions : versions.slice(0, 3);

  return (
    <Card size="sm">
      <CardTitle className="text-foreground normal-case tracking-normal">{t("versionHistory")}</CardTitle>
      <div className="space-y-3">
        {displayed.map((v, i) => (
          <div key={v.version} className="relative pl-4 border-l-2 border-border">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-accent tabular-nums">v{v.version}</span>
              <span className="text-[10px] text-dim-foreground">
                {dateFormatter.format(new Date(v.timestamp))}
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{v.changelog}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-dim-foreground">{v.author}</span>
              {v.pr && (
                <a
                  href={`https://github.com/q-kimi/nowly/pull/${v.pr.replace("#", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                >
                  {v.pr}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            {i < displayed.length - 1 && <div className="h-3" />}
          </div>
        ))}

        {versions.length > 3 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            {t("showAllVersions", { count: versions.length })}
          </button>
        )}
      </div>
    </Card>
  );
};
