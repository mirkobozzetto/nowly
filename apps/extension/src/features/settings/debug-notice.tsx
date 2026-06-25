import type { NativeStatus } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { PresenceDebug } from "@/shared/types";
import { Activity } from "lucide-react";
import type { FC, ReactElement } from "react";

type Props = {
  debug: PresenceDebug | null;
  nativeStatus: NativeStatus;
};

export const DebugNotice: FC<Props> = ({ debug, nativeStatus }): ReactElement | null => {
  const hasNativeIssue = !nativeStatus.connected || !nativeStatus.discordConnected;
  const nativeIssueMessage = !nativeStatus.connected
    ? t("diagnostic-host-missing-message")
    : !nativeStatus.discordConnected
      ? t("diagnostic-discord-closed-message")
      : nativeStatus.status;

  if (!debug && !hasNativeIssue) return null;

  return (
    <section className="rounded-lg border border-border bg-card-2 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim-foreground" />
        <div className="min-w-0 text-[11px] leading-5 text-muted-foreground">
          {debug && (
            <p className="truncate">
              <span className="font-semibold text-foreground">{debug.stage}</span>
              {" - "}
              {debug.message}
            </p>
          )}
          {hasNativeIssue && (
            <p className="truncate">
              <span className="font-semibold text-foreground">{t("debug-native-label")}</span>
              {" - "}
              {nativeIssueMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
