import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { WEB_BASE_URL } from "@/shared/constants";
import { useExtensionState } from "@/hooks/use-extension-state";
import { useLocalePreference } from "@/hooks/use-locale-preference";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { ActivityView } from "@/features/presences/activity-view";
import { DebugNotice } from "@/features/settings/debug-notice";
import { DebugPanel } from "@/features/settings/debug-panel";
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay";
import { SettingsView } from "@/features/settings/settings-view";
import { SidepanelNav, type SidepanelView } from "@/components/sidepanel-nav";

const App: FC = (): ReactElement => {
  const { activity, checkUpdates, connectNative, debug, entries, hostVersionInfo, isCheckingUpdates, nativeStatus, presences, removePresence, togglePresence, updates, settings, setSettings } =
    useExtensionState();
  const { localePreference, setLocalePreference } = useLocalePreference();
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts, refresh } = useOnboardingState();
  const [activeView, setActiveView] = useState<SidepanelView>("activity");
  const [debugOpen, setDebugOpen] = useState(false);
  const [isUnpacked, setIsUnpacked] = useState(false);

  useEffect(() => {
    try { setIsUnpacked(!chrome.runtime.getManifest().update_url) } catch { setIsUnpacked(false) }
  }, []);

  const onOpenMarketplace = (slug: string): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` });
  };

  const hasDebugIssue = debug || (nativeStatus.status !== "connected" && nativeStatus.status !== "ok");

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full min-w-0 flex-col gap-4 p-3">
        <Header nativeStatus={nativeStatus} />
        <SidepanelNav activeView={activeView} onChange={setActiveView} />

        {activeView === "activity" && (
          <ActivityView
            activity={activity}
            checkUpdates={checkUpdates}
            entries={entries}
            isCheckingUpdates={isCheckingUpdates}
            onOpenMarketplace={onOpenMarketplace}
            onRemove={removePresence}
            onToggle={togglePresence}
            presences={presences}
            settings={settings}
            updates={updates}
          />
        )}

        {activeView === "settings" && (
          <SettingsView
            hostVersionInfo={hostVersionInfo}
            localePreference={localePreference}
            onLocaleChange={setLocalePreference}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}

        {isUnpacked && hasDebugIssue && !debugOpen ? (
          <button type="button" onClick={() => setDebugOpen(true)} className="w-full text-left">
            <DebugNotice debug={debug} nativeStatus={nativeStatus} />
          </button>
        ) : null}

        {isUnpacked && debugOpen ? (
          <DebugPanel debug={debug} nativeStatus={nativeStatus} settings={settings} onSettingsChange={setSettings} />
        ) : null}
      </div>

      <OnboardingOverlay
        nativeStatus={onboardingNativeStatus}
        userScripts={userScripts}
        onboardingCompleted={onboarding.onboardingCompleted}
        localePreference={localePreference}
        onLocaleChange={setLocalePreference}
        onConnectNative={() => {
          connectNative();
          refresh();
        }}
        onComplete={() => setOnboarding({ onboardingCompleted: true })}
        onSkipTour={() => setOnboarding({ onboardingCompleted: true })}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </main>
  );
};

export default App;
