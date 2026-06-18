import { LocaleFlag } from "@/components/locale-flag";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { resolveLocale, t, type LocalePreference } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDebug } from "@/shared/types";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { DebugPanel } from "./debug-panel";
import { DisplaySettings } from "./display-settings";

type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

type Props = {
  debug: PresenceDebug | null;
  hostVersionInfo: HostVersionInfo | null;
  isLoading: boolean;
  localePreference: LocalePreference;
  nativeStatus: NativeStatus;
  onLocaleChange: (preference: LocalePreference) => void;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

const localeOptions: Array<{ label: string; value: LocalePreference }> = [
  { label: "Auto", value: "browser" },
  { label: "Français", value: "fr" },
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
];

export const SettingsView: FC<Props> = ({
  debug,
  hostVersionInfo,
  isLoading,
  localePreference,
  nativeStatus,
  onLocaleChange,
  settings,
  onSettingsChange,
}): ReactElement => {
  const [isUnpacked, setIsUnpacked] = useState(false);

  useEffect(() => {
    try { setIsUnpacked(!chrome.runtime.getManifest().update_url) } catch { setIsUnpacked(false) }
  }, []);

  const hasDebugIssue = debug || (nativeStatus.status !== "connected" && nativeStatus.status !== "ok");

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/5" />
          <Skeleton className="mb-3 h-3 w-2/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/5" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-8 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-8 w-full" rounded="lg" />
        </section>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {hostVersionInfo?.updateAvailable ? (
        <section className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-accent">
            {t("host-update-available", { latestVersion: hostVersionInfo.latestVersion })}
          </h2>
          <a
            href="https://nowly.me/host"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {t("host-download-update")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("language")}</h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("language-description")}</p>
        <div className="relative">
          <Select
            unstyled
            value={localePreference}
            onChange={(event) => onLocaleChange(event.target.value as LocalePreference)}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-card-2 px-3 pl-10 pr-10 text-sm text-foreground outline-none transition-colors hover:bg-card-hover focus:border-border-light"
          >
            {localeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <LocaleFlag locale={resolveLocale(localePreference)} />
          </div>
          <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
        </div>
      </section>

      <DisplaySettings settings={settings} onSettingsChange={onSettingsChange} />

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("features")}</h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("schedule-feature-description")}</p>
        <Label unstyled className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card-2 px-3 py-2">
          <span className="text-xs font-medium text-foreground">{t("schedule-feature")}</span>
          <Switch
            checked={settings.scheduleEnabled !== false}
            onChange={(checked) => onSettingsChange({ scheduleEnabled: checked })}
          />
        </Label>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("data-management")}</h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("analytics-description")}</p>

        <Label unstyled className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card-2 px-3 py-2">
          <span className="text-xs font-medium text-foreground">{t("analytics-consent")}</span>
          <Checkbox
            ariaLabel={t("analytics-consent")}
            checked={settings.analyticsConsent === true}
            onChange={(checked) => onSettingsChange({ analyticsConsent: checked })}
          />
        </Label>

        <a
          href={`${WEB_BASE_URL}/consent`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          {t("data-management")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      {isUnpacked && hasDebugIssue ? (
        <DebugPanel
          debug={debug}
          nativeStatus={nativeStatus}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      ) : null}
    </section>
  );
};