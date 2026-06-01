import type { FC, ReactElement } from "react";
import type { NativeStatus } from "../lib/messages";
import { NativeStatusButton } from "./NativeStatusButton";

type Props = {
  nativeStatus: NativeStatus;
  onConnect: () => void;
};

export const Header: FC<Props> = ({ nativeStatus, onConnect }): ReactElement => (
  <header className="flex items-center justify-between gap-3">
    <img src={chrome.runtime.getURL("app_title.png")} alt="Nowly" className="h-8 w-auto min-w-0" />
    <NativeStatusButton nativeStatus={nativeStatus} onConnect={onConnect} />
  </header>
);
