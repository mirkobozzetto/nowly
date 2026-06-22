import { Button } from "@/components/ui/button";
import type { NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";
import type { CurrentActivity, InstalledPresences, UserScriptsStatus } from "@/shared/types";
import { CheckCircle2, Clipboard, ExternalLink, LoaderCircle, XCircle } from "lucide-react";
import type { FC, ReactElement, ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "./diagnostic-status";

type Props = {
  activity: CurrentActivity | null;
  nativeStatus: NativeStatus;
  onConnectNative: () => void;
  presences: InstalledPresences;
  userScripts: UserScriptsStatus;
};

type RowStatus = "loading" | "success" | "error";

const siteUrl = (path: string): string => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`;

const extensionDetailsUrl = (): string => `chrome://extensions/?id=${chrome.runtime.id}`;

const openUrl = (url: string): void => {
  void chrome.tabs.create({ url });
};

const StatusIcon: FC<{ status: RowStatus }> = ({ status }) => {
  if (status === "loading") {
    return <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (status === "success") {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }

  return <XCircle className="h-4 w-4 text-destructive" />;
};

const StatusRow: FC<{
  action?: ReactNode;
  label: string;
  message: string;
  status: RowStatus;
}> = ({ action, label, message, status }) => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-card-2 px-3 py-2">
    <span className="mt-0.5 shrink-0">
      <StatusIcon status={status} />
    </span>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{message}</p>
      {action ? <div className="mt-2 flex flex-wrap gap-1.5">{action}</div> : null}
    </div>
  </div>
);

const SmallAction: FC<{
  children: ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
  >
    {children}
  </Button>
);

export const UserDiagnosticCard: FC<Props> = ({
  activity,
  nativeStatus,
  onConnectNative,
  presences,
  userScripts,
}): ReactElement => {
  const [copied, setCopied] = useState(false);
  const snapshot = useMemo(() => buildDiagnosticSnapshot({
    activity,
    nativeStatus,
    presences,
    userScripts,
  }), [activity, nativeStatus, presences, userScripts]);

  const hostStatus: RowStatus = snapshot.hostDetected
    ? "success"
    : isHostChecking(nativeStatus)
      ? "loading"
      : "error";

  const discordStatus: RowStatus = snapshot.discordConnected
    ? "success"
    : hostStatus === "loading"
      ? "loading"
      : "error";

  const supportLines = [
    `${t("diagnostic-extension-installed")}: ${snapshot.extensionInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-user-scripts-active")}: ${snapshot.userScriptsActive ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-host-detected")}: ${snapshot.hostDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-discord-connected")}: ${snapshot.discordConnected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-presence-installed")}: ${snapshot.presenceInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-activity-detected")}: ${snapshot.activityDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
  ];

  const copySupportDiagnostic = (): void => {
    void navigator.clipboard.writeText(supportLines.join("\n")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  const youtubeInstalled = snapshot.youtubePresenceInstalled;

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("diagnostic-title")}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            {t("diagnostic-description")}
          </p>
        </div>

        <Button
          variant="unstyled"
          size="none"
          onClick={copySupportDiagnostic}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <Clipboard className="h-3.5 w-3.5" />
          {copied ? t("support-diagnostic-copied") : t("support-diagnostic-copy")}
        </Button>
      </div>

      <div className="grid gap-2">
        <StatusRow
          status="success"
          label={t("diagnostic-extension-installed")}
          message={t("diagnostic-extension-installed-message")}
        />

        <StatusRow
          status={snapshot.userScriptsActive ? "success" : "error"}
          label={t("diagnostic-user-scripts-active")}
          message={snapshot.userScriptsActive
            ? t("diagnostic-user-scripts-active-message")
            : t("diagnostic-user-scripts-missing-message")}
          action={!snapshot.userScriptsActive ? (
            <SmallAction onClick={() => openUrl(extensionDetailsUrl())}>
              {t("onboarding-user-scripts-open-page")}
              <ExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={hostStatus}
          label={t("diagnostic-host-detected")}
          message={snapshot.hostDetected
            ? t("diagnostic-host-detected-message")
            : hostStatus === "loading"
              ? t("diagnostic-host-checking-message")
              : t("diagnostic-host-missing-message")}
          action={!snapshot.hostDetected && hostStatus !== "loading" ? (
            <>
              <SmallAction onClick={() => openUrl(siteUrl("/host"))}>
                {t("diagnostic-install-host")}
                <ExternalLink className="h-3 w-3" />
              </SmallAction>
              <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction>
            </>
          ) : undefined}
        />

        <StatusRow
          status={discordStatus}
          label={t("diagnostic-discord-connected")}
          message={snapshot.discordConnected
            ? t("diagnostic-discord-connected-message")
            : snapshot.hostDetected
              ? t("diagnostic-discord-closed-message")
              : t("diagnostic-discord-waiting-host-message")}
          action={!snapshot.discordConnected && snapshot.hostDetected ? (
            <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={snapshot.presenceInstalled ? "success" : "error"}
          label={t("diagnostic-presence-installed")}
          message={snapshot.presenceInstalled
            ? t("diagnostic-presence-installed-message", { count: String(snapshot.installedPresenceCount) })
            : t("diagnostic-presence-missing-message")}
          action={!snapshot.presenceInstalled ? (
            <SmallAction onClick={() => openUrl(siteUrl("/library/youtube"))}>
              {t("diagnostic-install-youtube")}
              <ExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={snapshot.activityDetected ? "success" : "error"}
          label={t("diagnostic-activity-detected")}
          message={snapshot.activityDetected
            ? t("diagnostic-activity-detected-message", { presence: snapshot.currentPresenceName ?? "Nowly" })
            : youtubeInstalled
              ? t("diagnostic-activity-missing-youtube-message")
              : t("diagnostic-activity-missing-message")}
          action={!snapshot.activityDetected ? (
            <SmallAction onClick={() => openUrl(youtubeInstalled ? YOUTUBE_TEST_URL : siteUrl("/library/youtube"))}>
              {youtubeInstalled ? t("diagnostic-test-youtube") : t("diagnostic-install-youtube")}
              <ExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />
      </div>
    </section>
  );
};