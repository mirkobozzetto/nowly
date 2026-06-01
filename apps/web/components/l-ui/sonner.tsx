"use client";

import { CheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "var(--border-light)",
          "--border-radius": "6px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "font-semibold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-3 px-6",
          description: "text-sm opacity-90",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
