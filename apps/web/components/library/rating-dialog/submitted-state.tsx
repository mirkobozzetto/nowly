"use client";

import { CheckIcon } from "lucide-react";
import type { FC, ReactElement } from "react";
import type { SubmittedStateProps } from "./types";

export const SubmittedState: FC<SubmittedStateProps> = ({ message }): ReactElement => (
  <div className="space-y-4 px-6 pb-6 text-center">
    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-success/20 bg-success/10 text-success">
      <CheckIcon className="size-5" />
    </div>

    <p className="text-sm leading-6 text-muted-foreground">{message}</p>
  </div>
);
