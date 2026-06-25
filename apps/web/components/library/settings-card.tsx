import { Card, CardTitle } from "@/components/ui/card";
import type { Presence } from "@/lib/data/presences";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Presence;
};

type RawSetting = Record<string, unknown>;

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "input";
  if (typeof value === "number") return "number";
  return "unknown";
};

export const SettingsCard: FC<Props> = ({ platform }): ReactElement | null => {
  const locale = useLocale();
  const t = useTranslations("marketplace-detail");

  if (!platform.settings || Object.keys(platform.settings).length === 0) return null;

  return (
    <Card size="sm">
      <CardTitle className="flex items-center gap-1.5 text-foreground normal-case tracking-normal">
        {t("settings")}
      </CardTitle>

      <div className="space-y-3">
        {Object.entries(platform.settings).map(([key, value]) => {
          const def = typeof value === "object" && value !== null ? (value as RawSetting) : null;
          const type = def?.type as string | undefined ?? inferType(value);
          const labelObj = def?.label as Record<string, string> | undefined;
          const description = def?.description as Record<string, string> | undefined;
          const label = labelObj?.[locale] ?? labelObj?.["en-US"] ?? key;
          const desc = description?.[locale] ?? description?.["en-US"];

          return (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <span className="rounded bg-card-foreground/55 px-1.5 py-0.5 text-[10px] uppercase text-muted">
                  {type}
                </span>
              </div>
              {desc && (
                <p className="text-xs text-muted-foreground">{desc}</p>
              )}
            </div>
          );
        })}
      </div>

    </Card>
  );
};