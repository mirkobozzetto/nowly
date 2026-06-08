import type { FC, ReactElement } from "react";
import type { NativeStatus } from "@/lib/messages";
import { NativeStatusButton } from "./native-status-button";

type Props = {
  nativeStatus: NativeStatus;
  onConnect: () => void;
};

export const Header: FC<Props> = ({ nativeStatus, onConnect }): ReactElement => (
  <header className="flex items-center justify-between gap-3">
    <img src={chrome.runtime.getURL("app_title_white.png")} alt="Nowly" className="h-8 w-auto min-w-0" />
    <div className="flex items-center gap-1">
      <NativeStatusButton nativeStatus={nativeStatus} onConnect={onConnect} />
    </div>
  </header>
);
