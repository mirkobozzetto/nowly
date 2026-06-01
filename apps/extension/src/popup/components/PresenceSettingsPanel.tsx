import { ChevronDown } from "lucide-react";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getLocale, t } from "../../shared/i18n";
import { sendMessage } from "../lib/messages";

type SettingDefinition = Record<string, unknown> & { default?: unknown; type?: string };

const localeKeyMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

const resolveLocaleString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const map = value as Record<string, string>;
    const locale = getLocale();
    return map[localeKeyMap[locale]] ?? map["en-US"] ?? undefined;
  }
  return undefined;
};

type Props = {
  definitions: Record<string, unknown>;
  slug: string;
};

const inferType = (value: unknown): string => {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "input";
  if (typeof value === "number") return "slider";
  return "unknown";
};

export const PresenceSettingsPanel: FC<Props> = ({ definitions, slug }): ReactElement | null => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const initialRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    sendMessage<Record<string, Record<string, unknown>>>("GET_PRESENCE_SETTINGS")
      .then((all) => {
        const saved = all[slug] ?? {};
        const defaults: Record<string, unknown> = {};
        for (const [key, def] of Object.entries(definitions)) {
          if (typeof def === "object" && def !== null && "default" in def) {
            defaults[key] = (def as SettingDefinition).default;
          } else {
            defaults[key] = def;
          }
        }
        const merged = { ...defaults, ...saved };
        setValues(merged);
        initialRef.current = merged;
        setLoaded(true);
      });
  }, [slug, definitions]);

  const handleChange = useCallback((key: string, value: unknown): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    void sendMessage("SET_PRESENCE_SETTINGS", { slug, partial: { [key]: value } });
  }, [slug]);

  if (!loaded || Object.keys(definitions).length === 0) return null;

  const settingKeys = Object.entries(definitions);

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{t("settings")}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3 pb-2">
          {settingKeys.map(([key, def]) => {
            const defObj = typeof def === "object" && def !== null ? (def as SettingDefinition) : null;
            const type = defObj?.type ?? inferType(def);
            const label = defObj?.label
              ? (resolveLocaleString(defObj.label) ?? key)
              : key;
            const placeholder = resolveLocaleString(defObj?.placeholder);
            const value = values[key];

            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-xs text-foreground">{label}</span>

                {type === "boolean" && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(value)}
                    onClick={() => handleChange(key, !value)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      value ? "bg-accent" : "bg-dim-foreground"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        value ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}

                {type === "input" && (
                  <input
                    type="text"
                    value={String(value ?? "")}
                    placeholder={placeholder ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="h-7 w-40 rounded-md border border-border bg-card-2 px-2 text-xs text-foreground outline-none transition-colors focus:border-border-light"
                  />
                )}

                {type === "select" && (
                  <select
                    value={String(value ?? "")}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="h-7 w-40 rounded-md border border-border bg-card-2 px-2 text-xs text-foreground outline-none transition-colors focus:border-border-light"
                  >
                  {(defObj?.options as Array<Record<string, unknown>> | undefined)?.map((opt) => {
                    const optValue = String(opt?.value ?? "");
                    const optionLabel = resolveLocaleString(opt?.label) ?? (opt?.label != null ? String(opt.label) : optValue);
                    return (
                      <option key={optValue} value={optValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                  </select>
                )}

                {type === "slider" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={defObj?.min !== undefined ? Number(defObj.min) : 0}
                      max={defObj?.max !== undefined ? Number(defObj.max) : 100}
                      step={defObj?.step !== undefined ? Number(defObj.step) : 1}
                      value={Number(value ?? 0)}
                      onChange={(e) => handleChange(key, Number(e.target.value))}
                      className="h-1 w-24 cursor-pointer accent-accent"
                    />
                    <span className="w-6 text-right text-xs text-muted-foreground">{String(value ?? 0)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
