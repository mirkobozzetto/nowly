"use client";

import { API_BASE_URL } from "@/lib/constants";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { useQuery } from "@tanstack/react-query";
import type { FC, ReactElement } from "react";
import { VersionUpdatesCard, type VersionUpdate } from "./version-updates-card";

type VersionHistoryEntry = {
  version: string;
  changelog: unknown;
  timestamp: number | string;
  author?: string;
  authorGithub?: string;
  releaseAuthor?: unknown;
  releaseContributors?: unknown;
  pr?: string;
  source?: "cli" | "pr";
  commitSha?: string;
  bundleSizeLabel?: string;
  versionType?: string;
  aiGeneratedChangelog?: boolean;
};

type Props = {
  presence: Presence;
  locale: string;
  installedVersion: string | null;
  onInstallVersion: (version: string) => void;
};

type ReleasePerson = {
  name: string;
  github?: string;
};

const getLocalizedChangelog = (
  changelog: unknown,
  locale: string,
): string | null => {
  if (!changelog) return null;

  if (typeof changelog === "object" && !Array.isArray(changelog)) {
    const localized = changelog as Record<string, unknown>;
    const value = localized[locale] ?? localized["en-US"] ?? Object.values(localized)[0];

    return typeof value === "string" ? value : null;
  }

  if (typeof changelog !== "string") return null;

  try {
    const parsed = JSON.parse(changelog) as unknown;
    return getLocalizedChangelog(parsed, locale);
  } catch {
    return changelog;
  }
};

const parseJsonField = <T,>(value: unknown): T | undefined => {
  if (!value) return undefined;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const getReleaseAuthor = (entry: VersionHistoryEntry): ReleasePerson | undefined => {
  const releaseAuthor = parseJsonField<ReleasePerson>(entry.releaseAuthor);
  if (releaseAuthor?.name) return releaseAuthor;
  if (!entry.author) return undefined;
  return {
    name: entry.author,
    github: entry.authorGithub,
  };
};

const formatVersionDate = (
  timestamp: number | string,
  dateFormatter: Intl.DateTimeFormat,
): string => {
  const date = typeof timestamp === "number"
    ? new Date(timestamp)
    : new Date(Number.isNaN(Number(timestamp)) ? timestamp : Number(timestamp));

  return dateFormatter.format(date);
};

export const PresenceVersionUpdatesCard: FC<Props> = ({
  presence,
  locale,
  installedVersion,
  onInstallVersion,
}): ReactElement | null => {
  const { data: versionHistory } = useQuery<VersionHistoryEntry[]>({
    queryKey: ["presence-versions", presence.slug],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/presences/${presence.slug}/versions`);

      if (!response.ok) {
        throw new Error("Failed to fetch presence versions");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!presence.version) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fallbackUpdate: VersionUpdate = {
    version: presence.version,
    date: dateFormatter.format(new Date(presence.lastUpdated)),
    description: getLocalizedDescription(presence, locale),
    author: presence.author,
  };

  const updates: VersionUpdate[] = versionHistory?.length
    ? versionHistory.map((entry) => ({
      version: entry.version,
      date: formatVersionDate(entry.timestamp, dateFormatter),
      description: getLocalizedChangelog(entry.changelog, locale)
        ?? getLocalizedDescription(presence, locale),
      author: getReleaseAuthor(entry),
      contributors: parseJsonField<ReleasePerson[]>(entry.releaseContributors) ?? [],
      pr: entry.pr,
      source: entry.source,
      commitSha: entry.commitSha,
      bundleSizeLabel: entry.bundleSizeLabel,
      versionType: entry.versionType,
      aiGeneratedChangelog: entry.aiGeneratedChangelog,
    }))
    : [fallbackUpdate];

  const hasCurrentVersion = updates.some((update) => update.version === presence.version);
  const visibleUpdates = hasCurrentVersion
    ? updates
    : [
      fallbackUpdate,
      ...updates,
    ];

  return (
    <VersionUpdatesCard
      currentVersion={presence.version}
      installedVersion={installedVersion}
      accentColor={presence.iconColor}
      updates={visibleUpdates}
      onInstallVersion={onInstallVersion}
    />
  );
};