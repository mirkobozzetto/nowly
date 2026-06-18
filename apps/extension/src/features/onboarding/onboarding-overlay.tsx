import type frMessages from "@/../messages/fr.json";
import { Header } from "@/components/header";
import { LocaleFlag } from "@/components/locale-flag";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { NativeStatus } from "@/lib/messages";
import { platforms } from "@/lib/platforms";
import { resolveLocale, t, type LocalePreference } from "@/shared/i18n";
import type { ExtensionSettings, UserScriptsStatus } from "@/shared/types";
import { BarChart3, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Lock, MonitorDown, PlugZap, Settings, ShoppingBag, Sparkles, X } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useMemo, useState } from "react";

type Props = {
  nativeStatus: NativeStatus;
  userScripts: UserScriptsStatus;
  onboardingCompleted: boolean;
  localePreference: LocalePreference;
  onLocaleChange: (locale: LocalePreference) => void;
  onConnectNative: () => void;
  onComplete: () => void;
  onSkipTour: () => void;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

const localeOptions: Array<{ label: string; value: LocalePreference }> = [
  { label: "Auto", value: "browser" },
  { label: "Français", value: "fr" },
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
];

const marketplaceLocale = (preference: LocalePreference): string => {
  const locale = resolveLocale(preference);
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  return "en-US";
};

const extensionDetailsUrl = (): string =>
  import.meta.env.BROWSER === "firefox"
    ? "about:addons"
    : `chrome://extensions/?id=${chrome.runtime.id}`;

const isNativeReady = (nativeStatus: NativeStatus): boolean =>
  Boolean(nativeStatus.connected || nativeStatus.discordConnected);

const PanelShell: FC<{ children: ReactElement; className?: string }> = ({ children, className = "" }) => (
  <div className="pointer-events-auto absolute inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-accent/10 p-6 backdrop-blur-md">
    <section className={`w-full max-w-[520px] rounded-lg border border-border bg-card/95 p-5 shadow-[0_18px_50px_rgba(0,0,0,.55)] ${className}`}>
      {children}
    </section>
  </div>
);

// On Firefox, userScripts is an optional permission granted via a runtime prompt that must
// originate from a user gesture (this click). On grant, useOnboardingState's poll picks up the
// new status and dismisses the gate. On Chrome, the user enables "Allow user scripts" from the
// extensions page instead.
const requestUserScriptsPermission = (): void => {
  void chrome.permissions.request({ permissions: ["userScripts"] }).catch(() => {
    // Declined or unavailable — the gate stays until the permission is granted.
  });
};

const UserScriptsGate: FC = () => (
  <PanelShell>
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">{t("onboarding-user-scripts-gate-title")}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("onboarding-user-scripts-gate-body")}</p>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("onboarding-user-scripts-gate-privacy")}</p>
      {import.meta.env.BROWSER === "firefox" ? (
        <Button
          variant="unstyled"
          size="none"
          onClick={requestUserScriptsPermission}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {t("onboarding-user-scripts-allow")}
        </Button>
      ) : (
        <>
          <Button
            variant="unstyled"
            size="none"
            onClick={() => chrome.tabs.create({ url: extensionDetailsUrl() })}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t("onboarding-user-scripts-open-page")}
            <ExternalLink className="h-4 w-4" />
          </Button>
          <p className="mt-3 break-all text-[11px] text-muted-foreground">{extensionDetailsUrl()}</p>
        </>
      )}
    </div>
  </PanelShell>
);

const NativeClientGate: FC<{ nativeStatus: NativeStatus; onConnectNative: () => void }> = ({ nativeStatus, onConnectNative }) => {
  const ready = isNativeReady(nativeStatus);

  return (
    <PanelShell>
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <MonitorDown className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center text-lg font-semibold text-foreground">{t("onboarding-native-gate-title")}</h1>
        <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">{t("onboarding-native-gate-body")}</p>
        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">{t("onboarding-native-gate-privacy")}</p>

        <div className="mt-5 grid gap-2">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex items-center gap-3 rounded-lg border border-border bg-card-2 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card p-2 text-foreground [&>svg]:h-full [&>svg]:w-full">
                {platform.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{platform.name}</p>
                <p className="text-xs text-muted-foreground">
                  {platform.downloadLink ? t("onboarding-platform-available") : t("onboarding-platform-soon")}
                </p>
              </div>
              {platform.downloadLink ? (
                <a
                  href={platform.downloadLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 shrink-0 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                >
                  {t("onboarding-download")}
                </a>
              ) : (
                <Button
                  variant="unstyled"
                  size="none"
                  disabled
                  className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-dim-foreground"
                >
                  {t("onboarding-coming-soon")}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-border bg-card-2 p-3">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${ready ? "bg-accent shadow-[0_0_18px_rgba(34,211,238,.7)]" : "bg-dim-foreground"}`} />
            <p className="text-xs leading-5 text-muted-foreground">{t("onboarding-native-gate-wait")}</p>
          </div>
          <Button
            variant="unstyled"
            size="none"
            onClick={onConnectNative}
            className="mt-3 inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          >
            {ready ? t("onboarding-native-connected") : t("connect-native")}
          </Button>
        </div>
      </div>
    </PanelShell>
  );
};

const notCollectedItems: Array<{ key: string }> = [
  { key: "urls" },
  { key: "titles" },
  { key: "searches" },
  { key: "content" },
  { key: "ips" },
  { key: "ids" },
];

const AnalyticsConsentGate: FC<{ onAccept: () => void; onDecline: () => void }> = ({ onAccept, onDecline }) => (
  <PanelShell>
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">{t("onboarding-analytics-title")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("onboarding-analytics-help")}</p>

      <div className="mt-5 grid grid-cols-2 gap-1.5 text-left">
        {notCollectedItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2">
            <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span className="text-xs text-muted-foreground">{t(`analytics-not-collect-${item.key}` as keyof typeof frMessages)}</span>
          </div>
        ))}
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2 col-span-2">
          <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="text-xs text-foreground">{t("analytics-collect-usage")}</span>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-dim-foreground">{t("onboarding-analytics-delete")}</p>

      <div className="mt-4 flex flex-col items-center gap-3">
        <Button
          variant="unstyled"
          size="none"
          onClick={onAccept}
          className="inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {t("onboarding-analytics-accept")}
        </Button>
        <Button
          variant="unstyled"
          size="none"
          onClick={onDecline}
          className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
        >
          {t("onboarding-analytics-decline")}
        </Button>
      </div>
    </div>
  </PanelShell>
);

const tourSteps = [
  {
    icon: Sparkles,
    title: "onboarding-tour-activity-title",
    body: "onboarding-tour-activity-body",
  },
  {
    icon: ShoppingBag,
    title: "onboarding-tour-library-title",
    body: "onboarding-tour-library-body",
  },
  {
    icon: PlugZap,
    title: "onboarding-tour-presences-title",
    body: "onboarding-tour-presences-body",
  },
  {
    icon: Settings,
    title: "onboarding-tour-settings-title",
    body: "onboarding-tour-settings-body",
  },
] as const;

export const OnboardingOverlay: FC<Props> = ({
  nativeStatus,
  userScripts,
  onboardingCompleted,
  localePreference,
  onLocaleChange,
  onConnectNative,
  onComplete,
  onSkipTour,
  settings,
  onSettingsChange,
}): ReactElement | null => {
  const [index, setIndex] = useState(0);
  const nativeReady = isNativeReady(nativeStatus);
  const step = tourSteps[index];
  const Icon = step.icon;
  const isLast = index === tourSteps.length - 1;

  const dots = useMemo(() => tourSteps.map((_, dotIndex) => dotIndex === index), [index]);

  if (!userScripts.enabled) return <UserScriptsGate />;
  if (!nativeReady) return <NativeClientGate nativeStatus={nativeStatus} onConnectNative={onConnectNative} />;
  if (settings.analyticsConsent === undefined) {
    return (
      <AnalyticsConsentGate
        onAccept={() => onSettingsChange({ analyticsConsent: true })}
        onDecline={() => onSettingsChange({ analyticsConsent: false })}
      />
    );
  }
  if (onboardingCompleted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
      <div className="pointer-events-auto absolute inset-0 flex min-h-0 flex-col p-3">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card/95 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
          <div className="flex items-center border-b border-border px-4 py-3">
            <Header />
            <div className="relative ml-auto">
              <Select
                unstyled
                value={localePreference}
                onChange={(event) => onLocaleChange(event.target.value as LocalePreference)}
                className="h-8 appearance-none rounded-lg border border-border bg-card-2 pl-8 pr-7 text-xs text-foreground outline-none transition-colors hover:bg-card-hover focus:border-border-light"
              >
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                <LocaleFlag locale={marketplaceLocale(localePreference)} />
              </div>
              <ChevronDown className="pointer-events-none absolute inset-y-0 right-2 my-auto h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center p-5 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-lg font-semibold text-foreground">{t(step.title)}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(step.body)}</p>
              <div className="mt-5 flex justify-center gap-1.5">
                {dots.map((active, dotIndex) => (
                  <span key={dotIndex} className={`h-1.5 rounded-full transition-all ${active ? "w-5 bg-accent" : "w-1.5 bg-dim-foreground"}`} />
                ))}
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <Button
              variant="unstyled"
              size="none"
              onClick={onSkipTour}
              className="rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
            >
              {t("onboarding-skip")}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="unstyled"
                size="none"
                disabled={index === 0}
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("onboarding-previous")}
              </Button>
              <Button
                variant="unstyled"
                size="none"
                onClick={() => {
                  if (isLast) onComplete();
                  else setIndex((current) => Math.min(tourSteps.length - 1, current + 1));
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-background transition-opacity hover:opacity-90"
              >
                {isLast ? t("onboarding-finish") : t("onboarding-next")}
                {isLast ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};
