import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-US", "fr-FR", "es-ES"],
  defaultLocale: "fr-FR",
  localePrefix: "always",
});
