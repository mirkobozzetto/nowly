import { Button, Label, Switch } from "@/components/ui";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDisplayMode } from "@/shared/types";
import { LayoutGrid, List } from "lucide-react";
import type { FC, ReactElement } from "react";

type Props = {
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

export const DisplaySettings: FC<Props> = ({ settings, onSettingsChange }): ReactElement => (
  <section className="rounded-lg border border-border bg-card p-4">
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("display")}</h2>
    <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("display-description")}</p>

    <div className="mb-3 flex gap-2">
      <Button
        variant="unstyled"
        size="none"
        onClick={() => onSettingsChange({ presenceDisplayMode: "category" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "category"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        {t("display-category")}
      </Button>
      <Button
        variant="unstyled"
        size="none"
        onClick={() => onSettingsChange({ presenceDisplayMode: "alphabetical" as PresenceDisplayMode })}
        className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          settings.presenceDisplayMode === "alphabetical"
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
        }`}
      >
        <List className="h-4 w-4" />
        {t("display-alphabetical")}
      </Button>
    </div>

    <Label
      unstyled
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card-2 px-3 py-2.5 transition-colors hover:bg-card-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">{t("separate-active")}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t("separate-active-description")}</p>
      </div>
      <Switch
        checked={settings.separateActivePresence}
        onChange={(checked) => onSettingsChange({ separateActivePresence: checked })}
        ariaLabel={t("separate-active")}
      />
    </Label>
  </section>
);
