import { ChevronDown, Terminal } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useState } from "react";
import { formatRelativeTime } from "../../popup/lib/format";
import type { NativeStatus } from "../../popup/lib/messages";
import { t } from "../../shared/i18n";
import type { PresenceDebug } from "../../shared/types";

type Props = {
  debug: PresenceDebug | null;
  nativeStatus: NativeStatus;
};

export const DebugPanel: FC<Props> = ({ debug, nativeStatus }): ReactElement => {
  const [open, setOpen] = useState(false);
  const hasNativeIssue = nativeStatus.status !== "connected" && nativeStatus.status !== "ok";
  const updatedAt = formatRelativeTime(debug?.updatedAt);

  return (
    <section className="mt-auto rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Terminal className="h-3.5 w-3.5" />
        <span className="min-w-0 flex-1 font-semibold text-foreground">{t("debug")}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2.5 text-[11px] leading-5 text-muted-foreground">
          {debug ? (
            <p className="break-words">
              <span className="font-semibold text-foreground">{debug.stage}</span>
              {" - "}
              {debug.message}
              {updatedAt ? <span className="text-dim-foreground"> - {updatedAt}</span> : null}
            </p>
          ) : (
            <p className="text-dim-foreground">idle</p>
          )}

          {hasNativeIssue && (
            <p className="mt-1 break-words">
              <span className="font-semibold text-foreground">native</span>
              {" - "}
              {nativeStatus.status}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
