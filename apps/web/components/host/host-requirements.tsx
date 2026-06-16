import type { Platform } from "@/hooks/use-platform";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Exclude<Platform, "">;
};

const requirementsData: Record<Exclude<Platform, "">, Array<{ key: string; value: string }>> = {
  windows: [
    { key: "req-os", value: "Windows 10 ou Windows 11" },
    { key: "req-arch", value: "64-bit (x64)" },
    { key: "req-discord", value: "Application Discord installée et en cours d'exécution" },
    { key: "req-browser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "req-storage", value: "req-storage-windows-value" },
  ],
  macos: [
    { key: "req-os", value: "macOS 11 Big Sur ou ultérieur" },
    { key: "req-arch", value: "Intel x64 / Apple Silicon (ARM64)" },
    { key: "req-discord", value: "Application Discord installée et en cours d'exécution" },
    { key: "req-browser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "req-storage", value: "req-storage-macos-value" },
  ],
  linux: [
    { key: "req-os", value: "Linux 2.6.32+ / glibc 2.17+" },
    { key: "req-arch", value: "64-bit (x64)" },
    { key: "req-discord", value: "Application Discord installée et en cours d'exécution" },
    { key: "req-browser", value: "Navigateur basé sur Chromium (Chrome, Edge, Brave, Opera)" },
    { key: "req-storage", value: "req-storage-linux-value" },
  ],
};

export const HostRequirements: FC<Props> = ({ platform }): ReactElement => {
  const t = useTranslations("host-page");
  const reqs = requirementsData[platform].map((req) => (
    req.key === "req-storage"
      ? { ...req, value: t(req.value) }
      : req
  ));

  return (
    <section id="requirements" className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight mb-6">{t("req-title")}</h2>

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
