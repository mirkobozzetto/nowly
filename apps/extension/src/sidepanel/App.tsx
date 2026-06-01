import type { FC, ReactElement } from "react";
import { useState } from "react";
import { Header } from "../popup/components/Header";
import { useExtensionState } from "../popup/hooks/useExtensionState";
import { useLocalePreference } from "../popup/hooks/useLocalePreference";
import { ActivityView } from "./components/ActivityView";
import { DebugPanel } from "./components/DebugPanel";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { SettingsView } from "./components/SettingsView";
import { SidepanelNav, type SidepanelView } from "./components/SidepanelNav";
import { useOnboardingState } from "./hooks/useOnboardingState";

const App: FC = (): ReactElement => {
  const { activity, connectNative, debug, entries, nativeStatus, presences, removePresence, togglePresence } =
    useExtensionState();
  const { localePreference, setLocalePreference } = useLocalePreference();
  const [activeView, setActiveView] = useState<SidepanelView>("activity");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts, refresh } = useOnboardingState();

  const showOnboarding = (!onboarding.onboardingCompleted || !onboarding.nativeSeenConnectedOnce) && !onboardingDismissed;

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full min-w-0 flex-col gap-4 p-3">
        <Header nativeStatus={nativeStatus} onConnect={connectNative} />
        <SidepanelNav activeView={activeView} onChange={setActiveView} />

        {activeView === "activity" && (
          <ActivityView
            activity={activity}
            entries={entries}
            onRemove={removePresence}
            onToggle={togglePresence}
            presences={presences}
          />
        )}

        {activeView === "settings" && (
          <SettingsView
            localePreference={localePreference}
            nativeStatus={nativeStatus}
            onConnect={connectNative}
            onLocaleChange={setLocalePreference}
          />
        )}

        <DebugPanel debug={debug} nativeStatus={nativeStatus} />
      </div>

      {showOnboarding && (
        <OnboardingOverlay
          localePreference={localePreference}
          nativeStatus={onboardingNativeStatus}
          userScripts={userScripts}
          onboardingCompleted={onboarding.onboardingCompleted}
          nativeSeenConnectedOnce={onboarding.nativeSeenConnectedOnce}
          cachedProfile={onboarding.nativeProfile}
          onConnectNative={() => {
            connectNative();
            refresh();
          }}
          onComplete={() => {
            setOnboarding({ onboardingCompleted: true });
            setOnboardingDismissed(true);
          }}
          onSkip={() => setOnboardingDismissed(true)}
        />
      )}
    </main>
  );
};

export default App;
