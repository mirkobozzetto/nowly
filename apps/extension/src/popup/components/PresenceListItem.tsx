import { Power, Settings, Trash2, X } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../../shared/api";
import { t } from "../../shared/i18n";
import type { StoredPresence } from "../../shared/types";

type Props = {
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  slug: string;
};

export const PresenceListItem: FC<Props> = ({ onRemove, onToggle, presence, slug }): ReactElement | null => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const itemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!actionsOpen) return;

    const handlePointerDown = (event: PointerEvent): void => {
      if (!itemRef.current?.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [actionsOpen]);

  if (!presence?.metadata) return null;

  return (
    <article
      ref={itemRef}
      onMouseLeave={() => setActionsOpen(false)}
      className="group relative overflow-hidden bg-card-2 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-card-hover"
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
        style={{ backgroundColor: `${presence.metadata.color}20` }}
      >
        <img src={assetUrl(slug, "icon")} alt="" className="h-6 w-6 object-contain" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{presence.metadata.name}</p>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className={presence.enabled ? "h-1.5 w-1.5 rounded-full bg-accent" : "h-1.5 w-1.5 rounded-full bg-dim-foreground"} />
          <span className="truncate">
            {presence.enabled ? t("enabled") : t("disabled")}
            {presence.metadata.version ? ` - ${t("version", { version: presence.metadata.version })}` : ""}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={t("settings")}
        title={t("settings")}
        onClick={() => setActionsOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>
      </div>

      <div
        className={
          actionsOpen
            ? "absolute inset-0 flex items-center justify-end gap-1.5 bg-linear-to-l from-card via-card/90 to-card/45 px-3 opacity-100 backdrop-blur-md transition-all"
            : "pointer-events-none absolute inset-0 flex translate-x-full items-center justify-end gap-1.5 bg-linear-to-l from-card via-card/90 to-card/45 px-3 opacity-0 backdrop-blur-md transition-all"
        }
      >
        <button
          type="button"
          aria-label={presence.enabled ? t("disable") : t("enable")}
          title={presence.enabled ? t("disable") : t("enable")}
          onClick={() => {
            onToggle(slug, !presence.enabled);
            setActionsOpen(false);
          }}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Power className="h-4 w-4" />
          {presence.enabled ? t("disable") : t("enable")}
        </button>
        <button
          type="button"
          aria-label={t("remove")}
          title={t("remove")}
          onClick={() => onRemove(slug)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {t("uninstall")}
        </button>
        <button
          type="button"
          aria-label={t("close")}
          title={t("close")}
          onClick={() => setActionsOpen(false)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
          {t("close")}
        </button>
      </div>
    </article>
  );
};
