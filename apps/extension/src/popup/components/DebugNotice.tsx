import { Activity } from "lucide-react";
import type { FC, ReactElement } from "react";
import type { PresenceDebug } from "@/shared/types";
import type { NativeStatus } from "@/popup/lib/messages";

type Props = {
  debug: PresenceDebug | null;
  nativeStatus: NativeStatus;
};

export const DebugNotice: FC<Props> = ({ debug, nativeStatus }): ReactElement | null => {
  if (!debug && nativeStatus.status === "connected") return null;

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
          {nativeStatus.status !== "connected" && nativeStatus.status !== "ok" && (
            <p className="truncate">
              <span className="font-semibold text-foreground">native</span>
              {" - "}
              {nativeStatus.status}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
