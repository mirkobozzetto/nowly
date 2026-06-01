import { ExternalLink, PauseCircle, PlayCircle, Power, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "../shared/api";
import { WEB_BASE_URL } from "../shared/constants";
import { t } from "../shared/i18n";
import type { CurrentActivity, InstalledPresences, PresenceDebug, StoredPresence } from "../shared/types";

type NativeStatus = {
  connected: boolean;
  status: string;
};

const sendMessage = <T,>(type: string, payload?: unknown): Promise<T> =>
  chrome.runtime.sendMessage({ source: "PRESENCES_POPUP", type, payload });

const StatusPill: FC<{ nativeStatus: NativeStatus; onConnect: () => void }> = ({
  nativeStatus,
  onConnect,
}): ReactElement => {
  const Icon = nativeStatus.connected ? Wifi : WifiOff;
  const isConnecting = nativeStatus.status === "connecting";
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-border bg-card-2 px-2 py-1.5 text-xs text-muted-foreground"
      title={nativeStatus.status}
    >
      <Icon className={nativeStatus.connected ? "h-3.5 w-3.5 text-success" : "h-3.5 w-3.5 text-destructive"} />
      <span>{nativeStatus.connected ? t("nativeConnected") : t("nativeDisconnected")}</span>
      <button
        type="button"
        aria-label={t("connectNative")}
        title={t("connectNative")}
        onClick={onConnect}
        disabled={isConnecting}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:bg-card-hover hover:text-foreground disabled:cursor-wait disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

const NowPlaying: FC<{ activity: CurrentActivity | null; presences: InstalledPresences }> = ({
  activity,
  presences,
}): ReactElement => {
  const presence = activity ? presences[activity.slug] : null;

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-dim-foreground">{t("current")}</h2>
        {activity ? <PauseCircle className="h-4 w-4 text-accent" /> : <PlayCircle className="h-4 w-4 text-dim-foreground" />}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card-2"
          style={{ backgroundColor: presence ? `${presence.metadata.color}20` : undefined }}
        >
          {presence ? (
            <img src={assetUrl(presence.metadata.slug, "icon")} alt="" className="h-9 w-9 object-contain" />
          ) : (
            <PlayCircle className="h-7 w-7 text-dim-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {activity?.presence.details ?? presence?.metadata.name ?? t("nothingPlaying")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {activity?.presence.state ?? presence?.metadata.name ?? "0:00 / 0:00"}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-card-2">
            <div className="h-full w-1/3 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </section>
  );
};

const PresenceRow: FC<{
  slug: string;
  presence: StoredPresence;
  onToggle: (slug: string, enabled: boolean) => void;
  onRemove: (slug: string) => void;
}> = ({ slug, presence, onToggle, onRemove }): ReactElement => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-card-hover">
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundColor: `${presence.metadata.color}20` }}
    >
      <img src={assetUrl(slug, "icon")} alt="" className="h-7 w-7 object-contain" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-semibold">{presence.metadata.name}</p>
        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase text-dim-foreground">
          {presence.metadata.category}
        </span>
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {presence.enabled ? t("enabled") : t("disabled")}
        {presence.metadata.version ? ` · ${t("version", { version: presence.metadata.version })}` : ""}
      </p>
    </div>

    <button
      type="button"
      aria-label={presence.enabled ? t("disable") : t("enable")}
      title={presence.enabled ? t("disable") : t("enable")}
      onClick={() => onToggle(slug, !presence.enabled)}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card-2 text-muted-foreground hover:text-foreground"
    >
      <Power className="h-4 w-4" />
    </button>
    <button
      type="button"
      aria-label={t("remove")}
      title={t("remove")}
      onClick={() => onRemove(slug)}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card-2 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

const App: FC = (): ReactElement => {
  const [presences, setPresences] = useState<InstalledPresences>({});
  const [activity, setActivity] = useState<CurrentActivity | null>(null);
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>({
    connected: false,
    status: "unknown",
  });
  const [debug, setDebug] = useState<PresenceDebug | null>(null);

  const entries = useMemo(() => Object.entries(presences), [presences]);

  useEffect(() => {
    const refresh = (): void => {
      void Promise.all([
        sendMessage<InstalledPresences>("GET_PRESENCES"),
        sendMessage<CurrentActivity | null>("GET_CURRENT_ACTIVITY"),
        sendMessage<NativeStatus>("GET_NATIVE_STATUS"),
        sendMessage<PresenceDebug | null>("GET_DEBUG"),
      ]).then(([nextPresences, nextActivity, nextNativeStatus, nextDebug]) => {
        setPresences(nextPresences ?? {});
        setActivity(nextActivity ?? null);
        setNativeStatus(nextNativeStatus ?? { connected: false, status: "unknown" });
        setDebug(nextDebug ?? null);
      });
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const togglePresence = (slug: string, enabled: boolean): void => {
    void sendMessage("TOGGLE_PRESENCE", { slug, enabled }).then(() => {
      setPresences((current) => ({
        ...current,
        [slug]: { ...current[slug], enabled },
      }));
    });
  };

  const removePresence = (slug: string): void => {
    void sendMessage("UNINSTALL_PRESENCE", { slug }).then(() => {
      setPresences((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
    });
  };

  const connectNative = (): void => {
    void sendMessage<NativeStatus>("CONNECT_NATIVE").then((status) => {
      setNativeStatus(status ?? { connected: false, status: "unknown" });
    });
  };

  return (
    <main className="w-[390px] bg-background p-4 text-foreground">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold leading-tight">{t("appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <StatusPill nativeStatus={nativeStatus} onConnect={connectNative} />
      </header>

      <div className="mb-4">
        <NowPlaying activity={activity} presences={presences} />
      </div>

      {debug && (
        <div className="mb-4 rounded-lg border border-border bg-card-2 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{debug.stage}</span>
          {" · "}
          {debug.message}
          {nativeStatus.status !== "connected" && nativeStatus.status !== "ok" && (
            <>
              <br />
              <span className="font-semibold text-foreground">native</span>
              {" · "}
              {nativeStatus.status}
            </>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-dim-foreground">{t("installed")}</h2>
        <a
          href={`${WEB_BASE_URL}/fr-FR/marketplace`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {t("marketplace")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {entries.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("emptyDescription")}</p>
        </section>
      ) : (
        <section className="space-y-2">
          {entries.map(([slug, presence]) => (
            <PresenceRow
              key={slug}
              slug={slug}
              presence={presence}
              onToggle={togglePresence}
              onRemove={removePresence}
            />
          ))}
        </section>
      )}
    </main>
  );
};

export default App;
