"use client";

import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/l-ui/dialog";
import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";
import { Coffee, Heart } from "lucide-react";

interface KofiModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KofiModal({ isOpen, onClose }: KofiModalProps) {
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
          <DialogTitle>Le projet est gratuit</DialogTitle>
          <DialogDescription>
            Developpe seul, sur mon temps libre.<br />
            Un cafe aide a faire avancer les choses.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogAction onClick={handleSupport}>
            <Heart className="w-4 h-4 fill-current" />
            Soutenir sur Ko-fi
          </DialogAction>

          <DialogCancel onClick={handleSkip}>
            Non merci, telecharger directement
          </DialogCancel>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
