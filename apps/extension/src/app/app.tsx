import { ActionBar } from "@/components/action-bar";
import { Header } from "@/components/header";
import { SidepanelNav, type SidepanelView } from "@/components/sidepanel-nav";
import { AnalyticsLogsView } from "@/features/analytics-logs/analytics-logs-view";
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay";
import { ActivityView } from "@/features/presences/activity-view";
import { ScheduleSheet } from "@/features/presences/schedule-sheet";
import { SnoozeSheet } from "@/features/presences/snooze-sheet";
import { SettingsView } from "@/features/settings/settings-view";
import { useExtensionState } from "@/hooks/use-extension-state";
import { useLocalePreference } from "@/hooks/use-locale-preference";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { sendMessage } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

const App: FC = (): ReactElement => {
  const { activity, checkHostUpdate, checkUpdates, connectNative, debug, entries, hostVersionInfo, isCheckingHostVersion, isCheckingUpdates, isLoading, isUnpacked, nativeStatus, presences, removePresence, togglePresence, updates, settings, setSettings } =
    useExtensionState();
  const { localePreference, setLocalePreference } = useLocalePreference();
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState();
  const [activeView, setActiveView] = useState<SidepanelView>("activity");
  const [snoozeSheetOpen, setSnoozeSheetOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null);
  const liveNativeStatus = onboardingNativeStatus.status === "unknown" && nativeStatus.status !== "unknown"
    ? nativeStatus
    : onboardingNativeStatus;
  const developerModeEnabled = settings.developerMode ?? isUnpacked;

  useEffect(() => {
    if (activeView === "analyticsLogs" && !developerModeEnabled) {
      setActiveView("activity");
    }
  }, [activeView, developerModeEnabled]);

  const onOpenMarketplace = useCallback((slug: string): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` });
  }, []);

  const activePresence = activity?.slug ? presences[activity.slug] : null;
  const isSnoozed = Boolean(activePresence?.snoozeUntil && activePresence.snoozeUntil > Date.now());

  const handleUnsnooze = useCallback((): void => {
    if (!activity?.slug) return;
    void sendMessage("CLEAR_SNOOZE", { slug: activity.slug });
  }, [activity?.slug]);

  const handleScheduleOpen = useCallback((slug: string | null) => {
    setScheduleSlug(slug);
    setScheduleSheetOpen(true);
  }, []);

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full min-w-0 flex-col gap-4 p-3">
        <Header nativeStatus={liveNativeStatus} />
        <SidepanelNav activeView={activeView} onChange={setActiveView} showAnalyticsLogs={developerModeEnabled} />

        {activeView === "activity" ? (
          <section className="flex min-h-0 flex-1 flex-col gap-3">
            <ActivityView
              activity={activity}
              entries={entries}
              isLoading={isLoading}
              onOpenMarketplace={onOpenMarketplace}
              onRemove={removePresence}
              onSchedule={handleScheduleOpen}
              onToggle={togglePresence}
              presences={presences}
              settings={settings}
              updates={updates}
            />

            <ActionBar
              activeSlug={activity?.slug ?? null}
              isCheckingUpdates={isCheckingUpdates}
              isSnoozed={isSnoozed}
              scheduleEnabled={settings.scheduleEnabled !== false}
              onCheckUpdates={checkUpdates}
              onScheduleClick={() => handleScheduleOpen(null)}
              onSnoozeClick={() => setSnoozeSheetOpen(true)}
              onUnsnoozeClick={handleUnsnooze}
            />
          </section>
        ) : activeView === "analyticsLogs" && developerModeEnabled ? (
          <AnalyticsLogsView />
        ) : (
          <SettingsView
            debug={debug}
            hostVersionInfo={hostVersionInfo}
            isCheckingHostVersion={isCheckingHostVersion}
            isLoading={isLoading}
            localePreference={localePreference}
            nativeStatus={liveNativeStatus}
            onCheckHostUpdate={checkHostUpdate}
            onLocaleChange={setLocalePreference}
            settings={settings}
            onSettingsChange={setSettings}
          />
        )}
      </div>

      <SnoozeSheet
        activeSlug={activity?.slug ?? null}
        onClose={() => setSnoozeSheetOpen(false)}
        open={snoozeSheetOpen}
        presences={presences}
      />

      <ScheduleSheet
        activeSlug={scheduleSlug}
        globalSchedule={settings.globalSchedule}
        onClose={() => setScheduleSheetOpen(false)}
        open={scheduleSheetOpen}
        presences={presences}
      />

      <OnboardingOverlay
        activity={activity}
        nativeStatus={liveNativeStatus}
        presences={presences}
        userScripts={userScripts}
        onboardingCompleted={onboarding.onboardingCompleted}
        localePreference={localePreference}
        onLocaleChange={setLocalePreference}
        onConnectNative={() => {
          connectNative();
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
