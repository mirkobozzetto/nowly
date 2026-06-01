import { BadgeCheck, ChevronRight, ExternalLink, Lock, PlugZap, ShoppingBag } from "lucide-react";
import type { FC, ReactElement } from "react";
import { NativeStatusButton } from "../../popup/components/NativeStatusButton";
import { WEB_BASE_URL } from "../../shared/constants";
import type { DiscordProfileSnapshot, UserScriptsStatus } from "../../shared/types";
import { resolveLocale, t, type LocalePreference } from "../../shared/i18n";
import type { NativeStatus } from "../../popup/lib/messages";

type Props = {
  localePreference: LocalePreference;
  nativeStatus: NativeStatus;
  userScripts: UserScriptsStatus;
  onboardingCompleted: boolean;
  nativeSeenConnectedOnce: boolean;
  cachedProfile?: DiscordProfileSnapshot | null;
  onConnectNative: () => void;
  onComplete: () => void;
  onSkip: () => void;
};

const marketplaceLocale = (preference: LocalePreference): "fr-FR" | "en-US" =>
  resolveLocale(preference) === "fr" ? "fr-FR" : "en-US";

const avatarUrl = (profile: DiscordProfileSnapshot): string | null => {
  if (!profile.avatar?.trim()) return null;
  // Use CDN for a crisp preview; we only get the hash from Discord IPC.
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=96`;
};

const extensionsDetailsUrl = (): string => {
  const id = chrome.runtime.id;
  return `chrome://extensions/?id=${id}`;
};

export const OnboardingOverlay: FC<Props> = ({
  localePreference,
  nativeStatus,
  userScripts,
  onboardingCompleted,
  nativeSeenConnectedOnce,
  cachedProfile,
  onConnectNative,
  onComplete,
  onSkip,
}): ReactElement => {
  const profile = cachedProfile;
  const hasProfile = Boolean(profile?.id && profile?.username);
  const connectedToDiscord = Boolean(nativeStatus.discordConnected);
  const step2Done = connectedToDiscord || nativeSeenConnectedOnce;

  // Guided but not blocking: users can dismiss, but we keep it as the primary first view.
  const showComplete = step2Done && !onboardingCompleted;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />

      <div className="pointer-events-auto absolute inset-0 flex min-h-0 flex-col p-3">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card/90 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
          <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("appName")}</p>
              <h1 className="mt-1 truncate text-sm font-semibold text-foreground">{t("onboardingTitle")}</h1>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("onboardingSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="shrink-0 rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
            >
              {t("onboardingSkip")}
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <PlugZap className="h-4 w-4 text-accent" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("onboardingStep1Title")}</h2>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{t("onboardingStep1Body")}</p>
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  {step2Done ? (
                    <BadgeCheck className="h-4 w-4 text-success" />
                  ) : (
                    <PlugZap className="h-4 w-4 text-discord" />
                  )}
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("onboardingStep2Title")}</h2>
                </div>

                <p className="mb-3 text-xs leading-5 text-muted-foreground">
                  {t("onboardingStep2Body")}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <NativeStatusButton nativeStatus={nativeStatus} onConnect={onConnectNative} />
                  <a
                    href={`${WEB_BASE_URL}/${marketplaceLocale(localePreference)}/library`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    {t("openMarketplace")}
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </div>

                <div className="mt-3 rounded-lg border border-border bg-card-2 p-3">
                  {connectedToDiscord ? (
                    <p className="text-xs text-muted-foreground">{t("onboardingDiscordConnected")}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t("onboardingDiscordWaiting")}</p>
                  )}

                  {hasProfile && profile ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-card">
                        {avatarUrl(profile) ? (
                          <img src={avatarUrl(profile)!} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {profile.username.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {profile.globalName?.trim() ? profile.globalName : profile.username}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">@{profile.username}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-accent" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("onboardingStep3Title")}</h2>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{t("onboardingStep3Body")}</p>
              </section>

              {!userScripts.enabled && (
                <section className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-accent" />
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("onboardingUserScriptsTitle")}</h2>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{t("onboardingUserScriptsBody")}</p>
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    {t("onboardingUserScriptsHow")}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => chrome.tabs.create({ url: extensionsDetailsUrl() })}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      {t("onboardingUserScriptsOpenPage")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] text-muted-foreground">{extensionsDetailsUrl()}</span>
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <p className="text-[11px] text-muted-foreground">{t("onboardingNonBlocking")}</p>
            <div className="flex items-center gap-2">
              {showComplete ? (
                <button
                  type="button"
                  onClick={onComplete}
                  className="inline-flex h-9 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-background transition-colors hover:opacity-90"
                >
                  {t("onboardingFinish")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSkip}
                  className="inline-flex h-9 items-center rounded-lg border border-border bg-card-2 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                >
                  {t("onboardingLater")}
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};
