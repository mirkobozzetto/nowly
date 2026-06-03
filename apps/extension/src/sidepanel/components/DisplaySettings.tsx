import { LayoutGrid, List } from "lucide-react";
import type { FC, ReactElement } from "react";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDisplayMode } from "@/shared/types";

type Props = {
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

export const DisplaySettings: FC<Props> = ({ settings, onSettingsChange }): ReactElement => (
  <section className="rounded-lg border border-border bg-card p-4">
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("display")}</h2>
    <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("displayDescription")}</p>

    <div className="mb-3 flex gap-2">
      <button
        type="button"
        onClick={() => onSettingsChange({ presenceDisplayMode: "category" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "category"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        {t("displayCategory")}
      </button>
      <button
        type="button"
        onClick={() => onSettingsChange({ presenceDisplayMode: "alphabetical" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "alphabetical"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <List className="h-4 w-4" />
        {t("displayAlphabetical")}
      </button>
    </div>

    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card-2 px-3 py-2.5 transition-colors hover:bg-card-hover">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{t("separateActive")}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t("separateActiveDescription")}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={settings.separateActivePresence}
        aria-label={t("separateActive")}
        onClick={() => onSettingsChange({ separateActivePresence: !settings.separateActivePresence })}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          settings.separateActivePresence ? "bg-accent" : "bg-dim-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            settings.separateActivePresence ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </label>
  </section>
);
