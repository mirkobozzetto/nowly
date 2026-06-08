"use client";

import { AppleIcon, LinuxIcon, WindowsIcon } from "@/components/icons";
import { usePlatform } from "@/hooks/use-platform";
import { CDN_INSTALLER_BASE_URL, HOST_VERSION, HOST_VERSION_URL } from "@/lib/constants";
import { Check, Code2, Feather, Monitor } from "lucide-react";
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
      .then((r) => r.json() as Promise<{ version: string }>)
      .then((data) => setVersion(data.version))
      .catch(() => setVersion(HOST_VERSION))
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
      downloads: [
        { label: t("winDownloadInstaller"), url: `${CDN_INSTALLER_BASE_URL}/nowly-setup.exe` },
        { label: t("winDownloadPortable"), url: `${CDN_INSTALLER_BASE_URL}/nowly-windows.zip` },
      ],
    },
    macos: {
      icon: AppleIcon,
      label: "macOS",
      downloads: [
        { label: t("downloadArchive"), url: `${CDN_INSTALLER_BASE_URL}/nowly-macos.tar.gz` },
      ],
    },
    linux: {
      icon: LinuxIcon,
      label: "Linux",
      downloads: [
        { label: t("downloadArchive"), url: `${CDN_INSTALLER_BASE_URL}/nowly-linux.tar.gz` },
      ],
    },
  };

  const activePlatform = manualPlatform ?? (detectedPlatform || "windows");
  const config = platformConfig[activePlatform];

  return (
    <>
      <HostHero />

      <div className="flex justify-center gap-2 mb-8">
        {platformKeys.map((key) => {
          const p = platformConfig[key];
          const Icon = p.icon;
          const isActive = key === activePlatform;
          const isDetected = detectedPlatform !== "" && key === detectedPlatform;

          return (
            <button
              key={key}
              onClick={() => setManualPlatform(key === manualPlatform ? null : key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {p.label}
              {isDetected && (
                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-linear-to-b from-card to-surface border border-border rounded-xl p-10 text-center mb-16">
        <Monitor className="w-12 h-12 mx-auto mb-4 text-accent" />

        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {t("cardTitle")}
        </h2>

        <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
          {t("cardVersion", { version: version ?? HOST_VERSION })}
        </p>

        <HostDownload config={config} />

        <div className="flex justify-center gap-6 flex-wrap mt-8">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Code2 className="w-4 h-4" />
            {t("chipOpenSource")}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Feather className="w-4 h-4" />
            {t("chipLightweight")}
          </div>
        </div>
      </div>

      <HostGuide />
      <HostRequirements platform={activePlatform} />
    </>
  );
};