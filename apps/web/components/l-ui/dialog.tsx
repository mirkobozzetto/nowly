"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-lg duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "default" | "destructive"
  size?: "default" | "sm"
}

function DialogContent({
  className,
  variant = "default",
  size = "default",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        data-size={size}
        className={cn(
          "group/dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl bg-card border border-border-light shadow-[0_32px_72px_rgba(0,0,0,0.8)] duration-100 outline-none overflow-hidden data-[size=default]:max-w-[400px] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "bg-card-2 border-b border-border px-7 py-9 text-center grid place-items-center gap-1.5 has-data-[slot=dialog-media]:gap-4",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "p-5 flex flex-col gap-2",
        className
      )}
      {...props}
    />
  );
}

function DialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-media"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full",
        "group-data-[variant=destructive]/dialog-content:bg-destructive/20 group-data-[variant=destructive]/dialog-content:text-destructive",
        "group-data-[variant=default]/dialog-content:bg-foreground/10 group-data-[variant=default]/dialog-content:text-foreground/90",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

function DialogAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & {
  variant?: "default" | "destructive"
}) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-action"
      data-variant={variant}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg font-semibold text-sm transition-all",
        "data-[variant=destructive]:bg-destructive data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:opacity-90",
        "data-[variant=default]:bg-foreground data-[variant=default]:text-background data-[variant=default]:hover:bg-[#e4e4e7]",
        className
      )}
      {...props}
    />
  );
}

function DialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-cancel"
      className={cn(
        "w-full px-2 py-2 bg-transparent text-dim-foreground text-sm text-center hover:text-muted-foreground hover:underline transition-colors cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
