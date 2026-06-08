"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";

export type VersionUpdate = {
  version: string;
  date: string;
  description: string;
  changelog?: string[];
  ctaLabel?: string;
  disabled?: boolean;
};

type VersionUpdatesCardProps = {
  currentVersion: string;
  updates: VersionUpdate[];
  className?: string;
  onInstallVersion?: (version: string) => void;
};

export const VersionUpdatesCard: FC<VersionUpdatesCardProps> = ({ currentVersion, updates, className, onInstallVersion }): ReactElement => {
  const t = useTranslations("VersionUpdatesCard");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sortedUpdates = useMemo(() => updates, [updates]);
  const selectedUpdate = sortedUpdates[selectedIndex];

  if (!selectedUpdate) return <></>;

  const isCurrentVersion = selectedUpdate.version === currentVersion;
  const shouldShowSelector = sortedUpdates.length > 1;

  const handleSelectVersion = (version: string): void => {
    const nextIndex = sortedUpdates.findIndex((update) => update.version === version);
    if (nextIndex !== -1) setSelectedIndex(nextIndex);
  };

  return (
    <Card className={cn("space-y-5", className)}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <CardTitle>{t("versionTitle", { version: selectedUpdate.version })}</CardTitle>
          {isCurrentVersion && <Badge variant="accent">{t("currentBadge")}</Badge>}
        </div>

        <CardDescription>{selectedUpdate.date}</CardDescription>

        {onInstallVersion ? (
          <CardAction>
            <Button
              size="sm"
              variant={isCurrentVersion ? "secondary" : "default"}
              disabled={isCurrentVersion || selectedUpdate.disabled}
              onClick={() => onInstallVersion(selectedUpdate.version)}
            >
              <DownloadIcon className="size-4" />
              {selectedUpdate.ctaLabel ?? t("installAction")}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{selectedUpdate.description}</p>
      </CardContent>

      {shouldShowSelector ? (
        <CardFooter className="flex items-center justify-end">
          <Select
            value={selectedUpdate.version}
            onValueChange={handleSelectVersion}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder={t("versionPlaceholder")} />
            </SelectTrigger>

            <SelectContent>
              {sortedUpdates.map((update) => (
                <SelectItem key={update.version} value={update.version}>{update.version}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardFooter>
      ) : null}
    </Card>
  );
};