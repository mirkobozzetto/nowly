import type { Platform } from "@/hooks/use-platform";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Exclude<Platform, "">;
};

const requirementsData: Record<Exclude<Platform, "">, Array<{ key: string; value: string }>> = {
  windows: [
    { key: "reqOs", value: "Windows 10 ou Windows 11" },
    { key: "reqArch", value: "64-bit (x64)" },
    { key: "reqDiscord", value: "Application Discord installée et en cours d'exécution" },
    { key: "reqBrowser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "reqStorage", value: "~15 Mo" },
  ],
  macos: [
    { key: "reqOs", value: "macOS 11 Big Sur ou ultérieur" },
    { key: "reqArch", value: "Intel x64 / Apple Silicon (ARM64)" },
    { key: "reqDiscord", value: "Application Discord installée et en cours d'exécution" },
    { key: "reqBrowser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "reqStorage", value: "~15 Mo" },
  ],
  linux: [
    { key: "reqOs", value: "Linux 2.6.32+ / glibc 2.17+" },
    { key: "reqArch", value: "64-bit (x64)" },
    { key: "reqDiscord", value: "Application Discord installée et en cours d'exécution" },
    { key: "reqBrowser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "reqStorage", value: "~15 Mo" },
  ],
};

export const HostRequirements: FC<Props> = ({ platform }): ReactElement => {
  const t = useTranslations("HostPage");
  const reqs = requirementsData[platform];

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-6">{t("reqTitle")}</h2>

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {reqs.map((req) => (
          <div key={req.key} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted-foreground">{t(req.key)}</span>
            <span className="text-sm font-medium">{req.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};