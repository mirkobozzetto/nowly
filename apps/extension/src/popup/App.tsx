import type { FC, ReactElement } from "react";
import { AppShell } from "./components/AppShell";
import { CurrentActivityCard } from "./components/CurrentActivityCard";
import { DebugNotice } from "./components/DebugNotice";
import { Header } from "./components/Header";
import { PresenceList } from "./components/PresenceList";
import { useExtensionState } from "./hooks/useExtensionState";
import { useLocalePreference } from "./hooks/useLocalePreference";

const App: FC = (): ReactElement => {
  const { activity, connectNative, debug, entries, nativeStatus, presences, removePresence, togglePresence } =
    useExtensionState();
  useLocalePreference();

  return (
    <AppShell>
      <Header nativeStatus={nativeStatus} onConnect={connectNative} />
      <CurrentActivityCard activity={activity} presences={presences} />
      <DebugNotice debug={debug} nativeStatus={nativeStatus} />
      <PresenceList entries={entries} onToggle={togglePresence} onRemove={removePresence} />
    </AppShell>
  );
};

export default App;
