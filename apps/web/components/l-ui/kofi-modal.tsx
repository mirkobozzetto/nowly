"use client";

import {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogTitle,
} from "@/components/l-ui/dialog";
import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";

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
            <svg
              className="w-5 h-5"
              viewBox="0 -4 24 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ overflow: "visible" }}
            >
              <path className="animate-smoke-1" d="M6 4 Q5 2 6 0 Q7 -2 6 -4" fill="none" />
              <path className="animate-smoke-2" d="M10 4 Q11 2 10 0 Q9 -2 10 -4" fill="none" />
              <path className="animate-smoke-3" d="M14 4 Q13 2 14 0 Q15 -2 14 -4" fill="none" />
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            </svg>
          </DialogMedia>
          <DialogTitle>Le projet est gratuit</DialogTitle>
          <DialogDescription>
            Developpe seul, sur mon temps libre.<br />
            Un cafe aide a faire avancer les choses.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogAction onClick={handleSupport}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
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
