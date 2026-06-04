import { WEB_BASE_URL } from "@/shared/constants";
import { resolveLocale } from "@/shared/i18n";
import type { FC, ReactElement } from "react";
import { AppShell } from "./components/AppShell";
import { CurrentActivityCard } from "./components/CurrentActivityCard";
import { DebugNotice } from "./components/DebugNotice";
import { Header } from "./components/Header";
import { PresenceList } from "./components/PresenceList";
import { useExtensionState } from "./hooks/useExtensionState";
import { useLocalePreference } from "./hooks/useLocalePreference";

const App: FC = (): ReactElement => {
  const { activity, connectNative, debug, entries, nativeStatus, presences, removePresence, togglePresence, updates, settings } =
    useExtensionState();
  const { localePreference } = useLocalePreference();

  const marketplaceLocale = (): string => {
    const locale = resolveLocale(localePreference);
    if (locale === "fr") return "fr-FR";
    if (locale === "es") return "es-ES";
    return "en-US";
  };

  const onOpenMarketplace = (slug: string): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/${marketplaceLocale()}/library/${slug}` });
  };

  return (
    <AppShell>
      <Header nativeStatus={nativeStatus} onConnect={connectNative} />
      <CurrentActivityCard activity={activity} presences={presences} />
      <DebugNotice debug={debug} nativeStatus={nativeStatus} />
      <PresenceList
        activeSlug={activity?.slug ?? null}
        displayMode={settings.presenceDisplayMode}
        entries={entries}
        onOpenMarketplace={onOpenMarketplace}
        onToggle={togglePresence}
        onRemove={removePresence}
        separateActive={settings.separateActivePresence}
        updates={updates}
      />
    </AppShell>
  );
};

export default App;
