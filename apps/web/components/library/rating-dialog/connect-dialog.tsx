"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogMedia, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  trigger: ReactElement;
  onLogin: () => void;
};

export const ConnectDialog: FC<Props> = ({ trigger, onLogin }): ReactElement => {
  const t = useTranslations("marketplace-detail");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent size="default">
        <DialogHeader>
          <DialogMedia>
            <MessageSquareIcon className="size-5" />
          </DialogMedia>

          <DialogTitle>
            {t("rate-login-title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 text-left">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("rate-login-desc1")}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("rate-login-desc2")}
          </p>

          <Button variant="accent" size="default" className="w-full" onClick={onLogin}>
            {t("rate-login-button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
