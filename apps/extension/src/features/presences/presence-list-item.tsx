import { BellRing, Settings } from "lucide-react";
import type { FC, MouseEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { PresenceActions } from "./presence-actions";
import { PresenceSettingsPanel } from "./presence-settings-panel";

type Props = {
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  slug: string;
  updateAvailable?: string;
};

export const PresenceListItem: FC<Props> = ({ onOpenMarketplace, onRemove, onToggle, presence, slug, updateAvailable }): ReactElement | null => {
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

  const hasSettings = presence.metadata.settings && typeof presence.metadata.settings === "object" && Object.keys(presence.metadata.settings).length > 0;

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
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: presence.enabled ? presence.metadata.color : "var(--color-dim-foreground)" }}
          />
          <span className="truncate">
            {presence.enabled ? t("enabled") : t("disabled")}
            {presence.metadata.version ? ` - ${t("version", { version: presence.metadata.version })}` : ""}
            {updateAvailable ? (
              <button
                type="button"
                onClick={(event: MouseEvent) => {
                  event.stopPropagation();
                  onOpenMarketplace(slug);
                }}
                className="ml-1.5 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: `${presence.metadata.color}26`,
                  color: presence.metadata.color,
                }}
                onPointerEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${presence.metadata.color}40`;
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${presence.metadata.color}26`;
                }}
              >
                <BellRing className="h-3 w-3" /> {updateAvailable}
              </button>
            ) : null}
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

      <PresenceActions
        enabled={presence.enabled}
        onClose={() => setActionsOpen(false)}
        onRemove={() => onRemove(slug)}
        onToggle={() => {
          onToggle(slug, !presence.enabled);
          setActionsOpen(false);
        }}
        visible={actionsOpen}
      />

      {hasSettings && (
        <PresenceSettingsPanel definitions={presence.metadata.settings as Record<string, unknown>} slug={slug} />
      )}
    </article>
  );
};
