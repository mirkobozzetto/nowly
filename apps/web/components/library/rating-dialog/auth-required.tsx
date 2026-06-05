"use client";

import { Button } from "@/components/ui/button";
import { MessageSquareIcon } from "lucide-react";
import type { FC, ReactElement } from "react";
import type { AuthRequiredProps } from "./types";

export const AuthRequired: FC<AuthRequiredProps> = ({ onLogin, title, description1, description2, buttonLabel }): ReactElement => (
  <div className="space-y-4 px-6 pb-6 text-left">
    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-muted/60 text-foreground">
      <MessageSquareIcon className="size-5" />
    </div>

    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-sm leading-6 text-muted-foreground">
        {description1}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        {description2}
      </p>
    </div>

    <Button variant="accent" size="default" className="w-full" onClick={onLogin}>
      {buttonLabel}
    </Button>
  </div>
);
