"use client";

import { AppleIcon, LinuxIcon, WindowsIcon } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "@/hooks/use-platform";
import { CDN_INSTALLER_BASE_URL, HOST_VERSION_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { HostDownload } from "./host-download";
import { HostGuide } from "./host-guide";
import { HostHero } from "./host-hero";
import { HostRequirements } from "./host-requirements";

const platformKeys = ["windows", "macos", "linux"] as const;

export const HostContent: FC = (): ReactElement => {
  const detectedPlatform = usePlatform();
  const [manualPlatform, setManualPlatform] = useState<(typeof platformKeys)[number] | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const t = useTranslations("HostPage");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(HOST_VERSION_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("failed to fetch host version");
        return r.json() as Promise<{ version: string }>;
      })
      .then((data) => setVersion(data.version))
      .catch(() => setVersion(null))
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const platformConfig = {
    windows: {
      icon: WindowsIcon,
      label: "Windows",
      details: t("windowsDetails"),
      downloads: [
        { label: t("winDownloadInstaller"), url: `${CDN_INSTALLER_BASE_URL}/nowly-setup.exe` },
        { label: t("winDownloadPortable"), url: `${CDN_INSTALLER_BASE_URL}/nowly-windows.zip` },
      ],
    },
    macos: {
      icon: AppleIcon,
      label: "macOS",
      details: t("macosDetails"),
      downloads: [
        { label: t("downloadArchive"), url: `${CDN_INSTALLER_BASE_URL}/nowly-macos.tar.gz` },
      ],
    },
    linux: {
      icon: LinuxIcon,
      label: "Linux",
      details: t("linuxDetails"),
      downloads: [
        { label: t("downloadArchive"), url: `${CDN_INSTALLER_BASE_URL}/nowly-linux.tar.gz` },
      ],
    },
  };

  const activePlatform = manualPlatform ?? (detectedPlatform || "windows");
  const config = platformConfig[activePlatform];
  const ActiveIcon = config.icon;

  return (
    <>
      <HostHero />

      <section className="mb-14 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:items-start">
          <Select
            value={activePlatform}
            onValueChange={(value) => setManualPlatform(value as (typeof platformKeys)[number])}
          >
            <SelectTrigger className="min-w-44" aria-label={t("platformSelectLabel")}>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {platformKeys.map((key) => {
                const item = platformConfig[key];
                const Icon = item.icon;

                return (
                  <SelectItem key={key} value={key}>
                    <Icon className="size-4" />
                    {item.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground">
            {t("cardVersion", { version: version ?? "latest", details: config.details })}
          </p>
          </div>

          <HostDownload config={config} layout="inline" />
        </div>
      </section>

      {/*
      <div className="mb-16 grid gap-3 sm:grid-cols-2">
        <a
          href={PROJECT_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-card-hover"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground">
            <GitHubIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{t("chipOpenSource")}</span>
            <span className="block text-xs text-muted-foreground">{t("chipOpenSourceDesc")}</span>
          </span>
        </a>

        <Link
          href="#requirements"
          className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-card-hover"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground">
            <Feather className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{t("chipLightweight")}</span>
            <span className="block text-xs text-muted-foreground">{t("chipLightweightDesc")}</span>
          </span>
          <LibraryBig className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </Link>
      </div>
      */}

      <HostGuide />
      <HostRequirements platform={activePlatform} />
    </>
  );
};
