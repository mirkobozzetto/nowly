import { BellRing, Calendar } from "lucide-react";
import type { FC, MouseEvent, ReactElement } from "react";
import { assetUrl } from "@/shared/api";
import { Button, Switch } from "@/components/ui";
import { t } from "@/shared/i18n";
import type { StoredPresence } from "@/shared/types";
import { PresenceSettingsPanel } from "./presence-settings-panel";

type Props = {
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  presence: StoredPresence;
  showSchedule: boolean;
  slug: string;
  updateAvailable?: string;
};

export const PresenceListItem: FC<Props> = ({ onOpenMarketplace, onRemove, onSchedule, onToggle, presence, showSchedule, slug, updateAvailable }): ReactElement | null => {
  if (!presence?.metadata) return null;

  return (
    <article className="group relative overflow-hidden bg-card-2 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-card-hover">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-all duration-300 ${
            !presence.enabled ? "opacity-60 saturate-0" : ""
          }`}
          style={{ backgroundColor: `${presence.metadata.color}20` }}
        >
          <img src={assetUrl(slug, "icon")} alt="" className={`h-6 w-6 object-contain transition-all duration-300 ${
            !presence.enabled ? "opacity-60 saturate-0" : ""
          }`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium transition-all duration-300 ${
            presence.enabled ? "text-foreground" : "text-muted-foreground/80"
          }`}>{presence.metadata.name}</p>
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: presence.enabled ? presence.metadata.color : "var(--color-dim-foreground)" }}
            />
            <span className="truncate">
              {presence.enabled ? t("enabled") : t("disabled")}
              {presence.metadata.version ? ` - ${t("version", { version: presence.metadata.version })}` : ""}
              {updateAvailable ? (
                <Button
                  variant="unstyled"
                  size="none"
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
                </Button>
              ) : null}
            </span>
          </div>
        </div>

        <Switch
          checked={presence.enabled}
          onChange={(checked) => onToggle(slug, checked)}
          ariaLabel={presence.enabled ? t("disable") : t("enable")}
        />

        <div className="flex items-center gap-0.5">
          {showSchedule ? (
            <Button
              variant="unstyled"
              size="none"
              onClick={(event: MouseEvent) => {
                event.stopPropagation();
                onSchedule(slug);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
              aria-label="Schedule"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          ) : null}

          <PresenceSettingsPanel
            definitions={presence.metadata.settings as Record<string, unknown>}
            onRemove={() => onRemove(slug)}
            slug={slug}
          />
        </div>
      </div>
    </article>
  );
};
