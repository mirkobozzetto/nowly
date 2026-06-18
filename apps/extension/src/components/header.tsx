import type { NativeStatus } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { FC, ReactElement } from "react";

type Props = {
  nativeStatus?: NativeStatus;
};

const statusColor = (ns: NativeStatus): string => {
  if (ns.discordConnected || ns.status === "connected" || ns.status === "ok") return "bg-accent";
  if (ns.connected && !ns.discordConnected) return "bg-accent";
  if (ns.status === "connecting") return "bg-muted-foreground";
  return "bg-red-500";
};

const statusText = (ns: NativeStatus): string => {
  if (ns.discordConnected) return t("native-connected");
  if (ns.connected && !ns.discordConnected) return "Discord disconnected";
  if (ns.status === "connecting") return t("native-disconnected");
  return t("native-disconnected");
};

export const Header: FC<Props> = ({ nativeStatus }): ReactElement => (
  <header className="flex items-center justify-between gap-3">
    <img src={chrome.runtime.getURL("app_title_white.png")} alt="Nowly" className="h-8 w-auto min-w-0" />
    {nativeStatus ? (
      <div className="flex items-center gap-2">
        <span role="status" aria-label={statusText(nativeStatus)} className={`inline-block h-2 w-2 rounded-full ${statusColor(nativeStatus)}`} />
        <span className="text-xs text-muted-foreground">{statusText(nativeStatus)}</span>
      </div>
    ) : null}
  </header>
);