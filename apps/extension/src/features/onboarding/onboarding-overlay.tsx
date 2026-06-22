import { Header } from "@/components/header";
import { LocaleFlag } from "@/components/locale-flag";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "@/features/diagnostics/diagnostic-status";
import { DiscordIcon } from "@/lib/icons";
import type { NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { resolveLocale, t, type LocalePreference } from "@/shared/i18n";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, UserScriptsStatus } from "@/shared/types";
import { BadgeInfo, BarChart3, Check, CheckCircle2, ChevronDown, ExternalLink, Lock, MonitorDown, Puzzle, ShoppingBag, X, Youtube } from "lucide-react";
import type { ComponentType, FC, ReactElement, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  activity: CurrentActivity | null;
  nativeStatus: NativeStatus;
  userScripts: UserScriptsStatus;
  devReplayOnboarding?: boolean;
  onboardingCompleted: boolean;
  localePreference: LocalePreference;
  onLocaleChange: (locale: LocalePreference) => void;
  onConnectNative: () => void;
  onComplete: () => void;
  onSkipTour: () => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

type MessageKey = Parameters<typeof t>[0];
type StepStatus = "loading" | "success" | "error";

type GuidedStep = {
  actions?: ReactNode;
  details?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  message: string;
  status: StepStatus;
  title: string;
};

const siteUrl = (path: string): string => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`;

const extensionDetailsUrl = (): string =>
  import.meta.env.BROWSER === "firefox"
    ? "about:addons"
    : `chrome://extensions/?id=${chrome.runtime.id}`;

const openUrl = (url: string): void => {
  void chrome.tabs.create({ url });
};

const marketplaceLocale = (preference: LocalePreference): string => {
  const locale = resolveLocale(preference);
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  return "en-US";
};

const requestUserScriptsPermission = (): void => {
  void chrome.permissions.request({ permissions: ["userScripts"] }).catch(() => {
    // Declined or unavailable: the step stays until the permission is granted.
  });
};

const notCollectedItems: MessageKey[] = [
  "analytics-not-collect-urls",
  "analytics-not-collect-titles",
  "analytics-not-collect-searches",
  "analytics-not-collect-content",
  "analytics-not-collect-ips",
  "analytics-not-collect-ids",
];

const ActionButton: FC<{ children: ReactNode; onClick: () => void; primary?: boolean }> = ({ children, onClick, primary = false }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className={
      primary
        ? "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        : "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card-2 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
    }
  >
    {children}
  </Button>
);

const QuietActionButton: FC<{ children: ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-dim-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  >
    {children}
  </Button>
);

const LinkActionButton: FC<{ children: ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  >
    {children}
  </Button>
);

const StepIcon: FC<{ icon: ComponentType<{ className?: string }>; status: StepStatus }> = ({ icon: Icon, status }) => (
  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${status === "success" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
    <Icon className="h-6 w-6" />
  </div>
);

const AnalyticsChecklist: FC = () => (
  <div className="mt-5 grid grid-cols-2 gap-1.5 text-left">
    {notCollectedItems.map((key) => (
      <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2">
        <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
        <span className="text-xs text-muted-foreground">{t(key)}</span>
      </div>
    ))}
    <div className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2">
      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="text-xs text-foreground">{t("analytics-collect-usage")}</span>
    </div>
    <p className="col-span-2 text-center text-xs leading-5 text-dim-foreground">{t("onboarding-analytics-delete")}</p>
  </div>
);

const stepDotClass = (active: boolean, done: boolean): string => {
  if (active) return "w-5 bg-accent";
  if (done) return "w-1.5 bg-success";
  return "w-1.5 bg-dim-foreground";
};

export const OnboardingOverlay: FC<Props> = ({
  activity,
  nativeStatus,
  userScripts,
  devReplayOnboarding = false,
  onboardingCompleted,
  localePreference,
  onLocaleChange,
  onConnectNative,
  onComplete,
  onSkipTour,
  presences,
  settings,
  onSettingsChange,
}): ReactElement | null => {
  const localeOptions = useMemo<Array<{ label: string; value: LocalePreference }>>(() => [
    { label: t("locale-auto"), value: "browser" },
    { label: t("locale-fr"), value: "fr" },
    { label: t("locale-en"), value: "en" },
    { label: t("locale-es"), value: "es" },
  ], [localePreference]);

  const snapshot = buildDiagnosticSnapshot({ activity, nativeStatus, presences, userScripts });
  const hostStatus: StepStatus = snapshot.hostDetected
    ? "success"
    : isHostChecking(nativeStatus)
      ? "loading"
      : "error";
  const discordStatus: StepStatus = snapshot.discordConnected
    ? "success"
    : snapshot.hostDetected
      ? "error"
      : "loading";
  const youtubeInstallStatus: StepStatus = snapshot.youtubePresenceInstalled
    ? "success"
    : snapshot.discordConnected
      ? "error"
      : "loading";
  const youtubeTestStatus: StepStatus = snapshot.youtubeActivityDetected
    ? "success"
    : snapshot.youtubePresenceInstalled
      ? "error"
      : "loading";
  const analyticsConsentDecided = settings.analyticsConsent !== undefined;
  const showHostActions = snapshot.userScriptsActive && !snapshot.hostDetected && hostStatus !== "loading";

  const steps: GuidedStep[] = [
    {
      icon: Puzzle,
      status: "success",
      title: t("onboarding-step-extension-title"),
      message: t("onboarding-step-extension-success"),
    },
    {
      icon: Lock,
      status: snapshot.userScriptsActive ? "success" : "error",
      title: t("onboarding-step-user-scripts-title"),
      message: snapshot.userScriptsActive
        ? t("onboarding-step-user-scripts-success")
        : t("onboarding-step-user-scripts-error"),
      details: !snapshot.userScriptsActive ? (
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-card-2 p-3 text-left">
          <p className="text-xs leading-5 text-muted-foreground">{t("onboarding-user-scripts-gate-body")}</p>
          <p className="text-xs leading-5 text-dim-foreground">{t("onboarding-user-scripts-gate-privacy")}</p>
        </div>
      ) : undefined,
      actions: !snapshot.userScriptsActive ? (
        import.meta.env.BROWSER === "firefox" ? (
          <ActionButton primary onClick={requestUserScriptsPermission}>
            {t("onboarding-user-scripts-allow")}
          </ActionButton>
        ) : (
          <ActionButton primary onClick={() => openUrl(extensionDetailsUrl())}>
            {t("onboarding-user-scripts-open-page")}
            <ExternalLink className="h-4 w-4" />
          </ActionButton>
        )
      ) : undefined,
    },
    {
      icon: MonitorDown,
      status: snapshot.userScriptsActive ? hostStatus : "loading",
      title: t("onboarding-step-host-title"),
      message: snapshot.hostDetected
        ? t("onboarding-step-host-success")
        : hostStatus === "loading" && snapshot.userScriptsActive
          ? t("onboarding-step-host-loading")
          : t("onboarding-step-host-error"),
      actions: showHostActions ? (
        <div className="flex flex-wrap justify-center gap-2">
          <ActionButton primary onClick={() => openUrl(siteUrl("/host"))}>
            {t("diagnostic-install-host")}
            <ExternalLink className="h-4 w-4" />
          </ActionButton>
          <ActionButton onClick={onConnectNative}>{t("diagnostic-check-connection")}</ActionButton>
        </div>
      ) : undefined,
    },
    {
      icon: DiscordIcon,
      status: discordStatus,
      title: t("onboarding-step-discord-title"),
      message: snapshot.discordConnected
        ? t("diagnostic-discord-connected-message")
        : snapshot.hostDetected
          ? t("diagnostic-discord-closed-message")
          : t("onboarding-step-discord-waiting"),
      actions: snapshot.hostDetected && !snapshot.discordConnected ? (
        <ActionButton primary onClick={onConnectNative}>{t("diagnostic-check-connection")}</ActionButton>
      ) : undefined,
    },
    {
      icon: ShoppingBag,
      status: youtubeInstallStatus,
      title: t("onboarding-step-presence-title"),
      message: snapshot.youtubePresenceInstalled
        ? t("onboarding-step-presence-success")
        : snapshot.discordConnected
          ? t("onboarding-step-presence-error")
          : t("onboarding-step-presence-waiting"),
      actions: snapshot.discordConnected && !snapshot.youtubePresenceInstalled ? (
        <ActionButton primary onClick={() => openUrl(siteUrl("/library/youtube"))}>
          {t("diagnostic-install-youtube")}
          <ExternalLink className="h-4 w-4" />
        </ActionButton>
      ) : undefined,
    },
    {
      icon: Youtube,
      status: youtubeTestStatus,
      title: t("onboarding-step-youtube-title"),
      message: snapshot.youtubeActivityDetected
        ? t("onboarding-step-youtube-success")
        : snapshot.youtubePresenceInstalled
          ? t("onboarding-step-youtube-error")
          : t("onboarding-step-youtube-waiting"),
      actions: snapshot.youtubePresenceInstalled && !snapshot.youtubeActivityDetected ? (
        <ActionButton primary onClick={() => openUrl(YOUTUBE_TEST_URL)}>
          {t("diagnostic-test-youtube")}
          <ExternalLink className="h-4 w-4" />
        </ActionButton>
      ) : undefined,
    },
    {
      icon: BarChart3,
      status: snapshot.youtubeActivityDetected
        ? analyticsConsentDecided
          ? "success"
          : "error"
        : "loading",
      title: t("onboarding-analytics-title"),
      message: analyticsConsentDecided
        ? t("onboarding-step-analytics-success")
        : snapshot.youtubeActivityDetected
          ? t("onboarding-analytics-help")
          : t("onboarding-step-analytics-waiting"),
      details: snapshot.youtubeActivityDetected && !analyticsConsentDecided ? <AnalyticsChecklist /> : undefined,
      actions: snapshot.youtubeActivityDetected && !analyticsConsentDecided ? (
        <div className="flex flex-col items-center gap-2">
          <ActionButton primary onClick={() => onSettingsChange({ analyticsConsent: true })}>
            {t("onboarding-analytics-accept")}
          </ActionButton>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <QuietActionButton onClick={() => onSettingsChange({ analyticsConsent: false })}>
              {t("onboarding-analytics-decline")}
            </QuietActionButton>
            <LinkActionButton onClick={() => openUrl(siteUrl("/data-collected"))}>
              <BadgeInfo className="h-3.5 w-3.5" />
              {t("onboarding-analytics-learn-more")}
            </LinkActionButton>
          </div>
        </div>
      ) : undefined,
    },
  ];

  const pendingIndex = steps.findIndex((step) => step.status !== "success");
  const allDone = pendingIndex === -1;
  const currentIndex = allDone ? steps.length : pendingIndex;
  const progressSteps = steps.slice(1);
  const progressIndex = allDone ? progressSteps.length : Math.max(0, currentIndex - 1);
  const [replayIndex, setReplayIndex] = useState(0);
  const replayMaxIndex = Math.max(0, progressSteps.length - 1);
  const clampedReplayIndex = Math.min(replayIndex, replayMaxIndex);
  const activeProgressIndex = devReplayOnboarding ? clampedReplayIndex : progressIndex;
  const canReplayPrevious = clampedReplayIndex > 0;
  const canReplayNext = clampedReplayIndex < replayMaxIndex;
  const [readyCountdown, setReadyCountdown] = useState(5);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (devReplayOnboarding) {
      setReplayIndex(0);
    }
  }, [devReplayOnboarding]);

  useEffect(() => {
    if (!devReplayOnboarding) return;
    setReplayIndex((current) => Math.min(current, replayMaxIndex));
  }, [devReplayOnboarding, replayMaxIndex]);

  useEffect(() => {
    if (devReplayOnboarding || !allDone || onboardingCompleted) {
      setReadyCountdown(5);
      return;
    }

    setReadyCountdown(5);
    const timer = window.setInterval(() => {
      setReadyCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [allDone, devReplayOnboarding, onboardingCompleted]);

  const replayStep = progressSteps[clampedReplayIndex] ?? steps[0];
  const currentStep: GuidedStep = devReplayOnboarding
    ? replayStep
    : allDone
    ? {
      actions: undefined,
      details: <p className="mt-2 text-xs leading-5 text-dim-foreground">{t("onboarding-ready-message")}</p>,
      icon: CheckCircle2,
      status: "success" as const,
      title: t("onboarding-ready-title"),
      message: t("onboarding-ready-countdown", { seconds: String(readyCountdown) }),
    }
    : steps[pendingIndex];
  const CurrentIcon = currentStep.icon;

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
              <StepIcon icon={CurrentIcon} status={currentStep.status} />
              <h1 className="mt-4 text-lg font-semibold text-foreground">{currentStep.title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentStep.message}</p>
              {currentStep.details}
              {currentStep.actions ? (
                <div className="mt-5 flex justify-center">{currentStep.actions}</div>
              ) : null}
              <div className="mt-5 flex justify-center gap-1.5">
                {progressSteps.map((step, dotIndex) => {
                  const dotClassName = `h-1.5 rounded-full transition-all ${stepDotClass(dotIndex === activeProgressIndex, step.status === "success")}`;

                  return devReplayOnboarding ? (
                    <button
                      key={step.title}
                      type="button"
                      aria-label={step.title}
                      title={step.title}
                      onClick={() => setReplayIndex(dotIndex)}
                      className={`${dotClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40`}
                    />
                  ) : (
                    <span
                      key={step.title}
                      className={dotClassName}
                    />
                  );
                })}
                {!devReplayOnboarding && allDone ? <span className="h-1.5 w-5 rounded-full bg-accent transition-all" /> : null}
              </div>
            </div>
          </div>

          {devReplayOnboarding ? (
            <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <Button
                variant="unstyled"
                size="none"
                disabled={!canReplayPrevious}
                onClick={() => setReplayIndex((current) => Math.max(0, current - 1))}
                className="rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card-2 disabled:hover:text-muted-foreground"
              >
                {t("onboarding-previous")}
              </Button>
              <Button
                variant="unstyled"
                size="none"
                onClick={onSkipTour}
                className="rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                {t("onboarding-finish")}
              </Button>
              <Button
                variant="unstyled"
                size="none"
                disabled={!canReplayNext}
                onClick={() => setReplayIndex((current) => Math.min(replayMaxIndex, current + 1))}
                className="rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card-2 disabled:hover:text-muted-foreground"
              >
                {t("onboarding-next")}
              </Button>
            </footer>
          ) : !allDone ? (
            <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <Button
                variant="unstyled"
                size="none"
                onClick={onSkipTour}
                className="rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                {t("onboarding-skip")}
              </Button>
            </footer>
          ) : null}
        </section>
      </div>
    </div>
  );
};