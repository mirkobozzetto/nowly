import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import type { Locale } from "./types";

const messages = { en, fr };

export const getLocale = (): Locale =>
  chrome.i18n.getUILanguage().toLowerCase().startsWith("fr") ? "fr" : "en";

export const t = (key: keyof typeof fr, params: Record<string, string> = {}): string => {
  const locale = getLocale();
  let value = messages[locale][key] ?? messages.fr[key] ?? key;
  for (const [name, replacement] of Object.entries(params)) {
    value = value.replace(`{${name}}`, replacement);
  }
  return value;
};