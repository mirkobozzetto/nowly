import { ChevronDown, ExternalLink, Monitor, RefreshCw, ShieldCheck } from "lucide-react";
import type { FC, ReactElement } from "react";
import { LocaleFlag } from "@/components/locale-flag";
import { NativeStatusButton } from "@/components/native-status-button";
import type { NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { resolveLocale, t, type LocalePreference } from "@/shared/i18n";
import type { ExtensionSettings } from "@/shared/types";
import { DisplaySettings } from "./display-settings";

type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

type Props = {
  checkUpdates: () => void;
  checkHostUpdate: () => void;
  hostVersionInfo: HostVersionInfo | null;
  isCheckingUpdates: boolean;
  isCheckingHostVersion: boolean;
  localePreference: LocalePreference;
  nativeStatus: NativeStatus;
  onConnect: () => void;
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

const marketplaceLocale = (preference: LocalePreference): "fr-FR" | "en-US" | "es-ES" => {
  const locale = resolveLocale(preference);
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  return "en-US";
};

export const SettingsView: FC<Props> = ({
  checkUpdates,
  checkHostUpdate,
  hostVersionInfo,
  isCheckingUpdates,
  isCheckingHostVersion,
  localePreference,
  nativeStatus,
  onConnect,
  onLocaleChange,
  settings,
  onSettingsChange,
}): ReactElement => (
  <section className="flex min-h-0 flex-1 flex-col gap-3">
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-accent" />
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("connection")}</h2>
      </div>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("connectionDescription")}</p>
      <NativeStatusButton nativeStatus={nativeStatus} onConnect={onConnect} />
    </section>

    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Monitor className="h-4 w-4 text-accent" />
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("hostVersion", { version: hostVersionInfo?.currentVersion ?? "?" })}</h2>
      </div>

      {hostVersionInfo?.updateAvailable ? (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <p className="font-medium">{t("hostUpdateAvailable", { latestVersion: hostVersionInfo.latestVersion })}</p>
        </div>
      ) : hostVersionInfo ? (
        <p className="mb-3 text-xs text-muted-foreground">{t("hostUpToDate")}</p>
      ) : isCheckingHostVersion ? (
        <p className="mb-3 text-xs text-muted-foreground">...</p>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">{t("hostVersion", { version: "?" })}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t("checkHostUpdate")}
          title={t("checkHostUpdate")}
          onClick={checkHostUpdate}
          disabled={isCheckingHostVersion}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHostVersion ? "animate-spin" : ""}`} />
          {t("checkHostUpdate")}
        </button>

        {hostVersionInfo?.updateAvailable && (
          <a
            href={`${WEB_BASE_URL}/host`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            {t("hostDownloadUpdate")}
          </a>
        )}
      </div>
    </section>

    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("language")}</h2>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("languageDescription")}</p>
      <div className="relative">
        <select
          value={localePreference}
          onChange={(event) => onLocaleChange(event.target.value as LocalePreference)}
          className="h-10 w-full appearance-none rounded-lg border border-border bg-card-2 px-3 pl-10 pr-10 text-sm text-foreground outline-none transition-colors hover:bg-card-hover focus:border-border-light"
        >
          {localeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          <LocaleFlag locale={marketplaceLocale(localePreference)} />
        </div>
        <ChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
      </div>
    </section>

    <DisplaySettings settings={settings} onSettingsChange={onSettingsChange} />

    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("marketplace")}</h2>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("marketplaceDescription")}</p>
      <div className="flex items-center gap-2">
        <a
          href={`${WEB_BASE_URL}/${marketplaceLocale(localePreference)}/library`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          {t("openMarketplace")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          aria-label={t("checkUpdates")}
          title={t("checkUpdates")}
          onClick={checkUpdates}
          disabled={isCheckingUpdates}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card-2 text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isCheckingUpdates ? "animate-spin" : ""}`} />
        </button>
      </div>
    </section>
  </section>
);
