"use client";

import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/ui/dialog";
import type { Presence } from "@/lib/data/presences";
import { Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  presence: Presence
  showUninstallConfirm: boolean
  setShowUninstallConfirm: (open: boolean) => void
  showDowngradeConfirm: boolean
  setShowDowngradeConfirm: (open: boolean) => void
  onConfirmUninstall: () => void
  onConfirmDowngrade: () => void
};

export const PresenceDetailDialogs: FC<Props> = ({
  presence,
  showUninstallConfirm,
  setShowUninstallConfirm,
  showDowngradeConfirm,
  setShowDowngradeConfirm,
  onConfirmUninstall,
  onConfirmDowngrade,
}): ReactElement => {
  const t = useTranslations("MarketplaceDetail");

  return (
    <>
      <Dialog open={showUninstallConfirm} onOpenChange={setShowUninstallConfirm}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogMedia>
              <Trash2 className="h-5 w-5" />
            </DialogMedia>

            <DialogTitle>{t("uninstallConfirmTitle")}</DialogTitle>

            <DialogDescription>
              {t("uninstallConfirmDescription", { platform: presence.name })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogAction variant="destructive" onClick={onConfirmUninstall}>
              {t("uninstallConfirmAction")}
            </DialogAction>

            <DialogCancel>{t("uninstallConfirmCancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogMedia>
              <TriangleAlert className="h-5 w-5" />
            </DialogMedia>

            <DialogTitle>{t("downgradeConfirmTitle")}</DialogTitle>

            <DialogDescription>
              {t("downgradeConfirmDescription", { platform: presence.name })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogAction onClick={onConfirmDowngrade}>
              {t("downgradeConfirmAction")}
            </DialogAction>

            <DialogCancel>{t("downgradeConfirmCancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
