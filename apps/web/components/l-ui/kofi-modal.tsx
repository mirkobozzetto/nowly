"use client";

import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/ui/dialog";
import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";
import { Coffee, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

interface KofiModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KofiModal({ isOpen, onClose }: KofiModalProps) {
  const t = useTranslations("kofi-modal");

  const triggerDownload = () => {
    const a = document.createElement("a");
    a.href = PROJECT_EXTENSION_DOWNLOAD_URL;
    a.download = "";
    a.click();
  };

  const handleSupport = () => {
    window.open("https://ko-fi.com/qkimi_", "_blank", "noopener,noreferrer");
    triggerDownload();
  };

  const handleSkip = () => {
    triggerDownload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent variant="default">
        <DialogHeader>
          <DialogMedia>
            <Coffee className="w-4 h-4" />
          </DialogMedia>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogAction onClick={handleSupport}>
            <Heart className="w-4 h-4 fill-current" />
            {t("support")}
          </DialogAction>

          <DialogCancel onClick={handleSkip}>
            {t("skip")}
          </DialogCancel>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
