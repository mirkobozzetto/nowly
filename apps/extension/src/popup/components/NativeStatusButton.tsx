import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { FC, ReactElement } from "react";
import { t } from "../../shared/i18n";
import type { NativeStatus } from "../lib/messages";

type Props = {
  nativeStatus: NativeStatus;
  onConnect: () => void;
};

export const NativeStatusButton: FC<Props> = ({ nativeStatus, onConnect }): ReactElement => {
  const connected = nativeStatus.connected;
  const isConnecting = nativeStatus.status === "connecting";
  const Icon = connected ? Wifi : WifiOff;

  return (
    <button
      type="button"
      aria-label={t("connectNative")}
      title={nativeStatus.status}
      onClick={onConnect}
      disabled={isConnecting}
      className="group flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:cursor-wait disabled:opacity-70"
    >
      <Icon className={connected ? "h-3.5 w-3.5 text-accent" : "h-3.5 w-3.5 text-destructive"} />
      <span>{connected ? t("nativeConnected") : t("nativeDisconnected")}</span>
      <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? "animate-spin" : "opacity-60 group-hover:opacity-100"}`} />
    </button>
  );
};
