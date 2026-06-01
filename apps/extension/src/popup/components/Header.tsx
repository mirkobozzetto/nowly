import type { FC, ReactElement } from "react";
import type { NativeStatus } from "../lib/messages";
import { NativeStatusButton } from "./NativeStatusButton";

type Props = {
  checkUpdates: () => void;
  nativeStatus: NativeStatus;
  onConnect: () => void;
};

export const Header: FC<Props> = ({ checkUpdates, nativeStatus, onConnect }): ReactElement => (
  <header className="flex items-center justify-between gap-3">
    <img src={chrome.runtime.getURL("app_title_white.png")} alt="Nowly" className="h-8 w-auto min-w-0" />
    <div className="flex items-center gap-1">
      {/* <button
        type="button"
        aria-label={t("checkUpdates")}
        title={t("checkUpdates")}
        onClick={checkUpdates}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <RefreshCw className="h-4 w-4" />
      </button> */}
      <NativeStatusButton nativeStatus={nativeStatus} onConnect={onConnect} />
    </div>
  </header>
);
