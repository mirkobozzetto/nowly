import {defineRouting} from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en-US", "fr-FR"],
  defaultLocale: "en-US",
  localeDetection: true,
})
